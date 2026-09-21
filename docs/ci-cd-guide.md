# CI/CD Guide

This guide explains how SourceLearn uses GitHub Actions for continuous integration and continuous deployment.

It is written as a practical reference for the repository: what runs, why it runs, how GitHub authenticates to AWS, and what each deployment workflow actually does.

---

## Overview

SourceLearn uses three GitHub Actions workflows:

```text
.github/workflows/
  ci.yml
  deploy-frontend.yml
  deploy-backend.yml
```

The overall flow is:

```text
code change
   |
   v
GitHub
   |
   +--> CI checks
   |
   +--> Frontend CD
   |      |
   |      +--> build React/Vite
   |      +--> assume AWS role with OIDC
   |      +--> sync build to S3
   |      +--> invalidate CloudFront
   |
   +--> Backend CD
          |
          +--> run Pytest
          +--> assume AWS role with OIDC
          +--> send SSM deployment command
          +--> EC2 updates repository
          +--> Docker Compose rebuilds
          +--> backend health check
```

No long-lived AWS access keys are stored in GitHub.

---

# 1. Continuous Integration

The CI workflow lives at:

```text
.github/workflows/ci.yml
```

It runs on pushes and pull requests for the configured branch.

The workflow has two independent jobs:

```text
backend-ci
frontend-ci
```

This keeps backend and frontend checks separated and makes failures easier to diagnose.

---

## Backend CI

The backend job uses Python 3.12.

Its flow is:

```text
checkout repository
      |
      v
set up Python 3.12
      |
      v
install backend/requirements-dev.txt
      |
      v
pytest tests/ -v
```

The important command is:

```bash
cd backend
pytest tests/ -v
```

The tests include normal API/service behavior as well as AWS/S3 behavior.

S3 calls are mocked in CI. The test suite should never upload files to the real SourceLearn bucket.

That means CI does not need real AWS credentials just to test the backend.

---

## Frontend CI

The frontend job uses Node.js 22.

Its flow is:

```text
checkout repository
      |
      v
set up Node.js 22
      |
      v
npm ci
      |
      v
TypeScript check
      |
      v
Vitest
```

The main commands are:

```bash
cd frontend
npm ci
npx tsc -b --noEmit
npm test
```

The TypeScript step catches compile-time problems without producing a build.

Vitest runs the frontend test suite.

---

# 2. Why deployment has separate workflows

Frontend and backend deployment are intentionally separate:

```text
deploy-frontend.yml
deploy-backend.yml
```

This matters because a frontend-only change should not rebuild the EC2 backend, and a backend-only change should not rebuild and upload the React application.

Each workflow uses a path filter.

Frontend:

```yaml
paths:
  - "frontend/**"
  - ".github/workflows/deploy-frontend.yml"
```

Backend:

```yaml
paths:
  - "backend/**"
  - ".github/workflows/deploy-backend.yml"
```

So deployment work only runs when that part of the application changes.

---

# 3. GitHub -> AWS authentication with OIDC

GitHub Actions authenticates to AWS using OpenID Connect instead of stored AWS access keys.

The flow is:

```text
GitHub Actions
      |
      | temporary OIDC token
      v
AWS STS
      |
      v
SourceLearnGitHubActionsRole
      |
      v
temporary AWS credentials
```

The workflow needs:

```yaml
permissions:
  id-token: write
  contents: read
```

`id-token: write` allows GitHub Actions to request an OIDC token.

The AWS credentials step uses:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: <SourceLearnGitHubActionsRole ARN>
    aws-region: ca-central-1
```

There are no `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` GitHub secrets.

---

## AWS OIDC provider

IAM contains an OpenID Connect provider for:

```text
https://token.actions.githubusercontent.com
```

with audience:

```text
sts.amazonaws.com
```

The IAM role trust policy restricts which GitHub repository/ref can assume the role.

One detail worth remembering: the GitHub OIDC `sub` claim for this repository includes GitHub's internal owner/repository IDs as well as the readable names.

During setup, the actual OIDC claims were inspected once to make the trust policy match the token exactly.

That debugging step was removed after authentication worked.

---

# 4. GitHub Actions AWS role

The deployment role is:

```text
SourceLearnGitHubActionsRole
```

It has only the permissions needed by the deployment workflows.

For frontend deployment it can:

- list the frontend S3 bucket
- upload objects
- replace objects
- delete stale objects
- create CloudFront invalidations

For backend deployment it can use Systems Manager actions such as:

- `ssm:SendCommand`
- `ssm:GetCommandInvocation`
- `ssm:ListCommandInvocations`

This keeps deployment access much narrower than using `AdministratorAccess` or `AmazonS3FullAccess`.

---

# 5. Frontend continuous deployment

The frontend workflow lives at:

```text
.github/workflows/deploy-frontend.yml
```

It runs when the configured deployment branch receives a frontend change.

The workflow is:

```text
checkout
   |
   v
Node.js 22
   |
   v
npm ci
   |
   v
TypeScript check
   |
   v
Vitest
   |
   v
Vite production build
   |
   v
AWS OIDC authentication
   |
   v
S3 sync
   |
   v
CloudFront invalidation
```

---

## Production API URL

The Vite build receives the backend CloudFront URL through:

```text
VITE_API_URL
```

The workflow sets it only for the production build.

That allows the same frontend code to use localhost during development and the HTTPS CloudFront API endpoint in production.

---

## S3 deployment

The production build is created in:

```text
frontend/dist/
```

GitHub Actions deploys it with:

```bash
aws s3 sync frontend/dist/ s3://sourcelearn-frontend-2026 --delete
```

`--delete` is important because Vite generates hashed asset names.

For example:

```text
old build:
assets/index-oldhash.js

new build:
assets/index-newhash.js
```

Without `--delete`, old bundles would accumulate in the bucket.

---

## CloudFront invalidation

After the S3 sync, the workflow runs:

```bash
aws cloudfront create-invalidation \
  --distribution-id <FRONTEND_DISTRIBUTION_ID> \
  --paths "/*"
```

This tells CloudFront to stop serving cached copies of the old frontend files.

The next request then receives the newly deployed build.

---

# 6. Backend continuous deployment

The backend workflow lives at:

```text
.github/workflows/deploy-backend.yml
```

It combines backend testing and deployment.

The high-level flow is:

```text
checkout
   |
   v
Python 3.12
   |
   v
install dev dependencies
   |
   v
pytest
   |
   v
AWS OIDC authentication
   |
   v
SSM SendCommand
   |
   v
EC2 deploys latest code
   |
   v
workflow waits for result
```

The backend is only deployed if Pytest succeeds.

---

# 7. Why SSM is used instead of SSH

The backend workflow does not store the EC2 `.pem` key in GitHub.

Instead it uses AWS Systems Manager Run Command.

The flow is:

```text
GitHub Actions
      |
      | OIDC
      v
SourceLearnGitHubActionsRole
      |
      | ssm:SendCommand
      v
AWS Systems Manager
      |
      v
SSM Agent on EC2
      |
      v
deployment commands
```

This avoids copying a permanent SSH private key into GitHub Secrets.

---

# 8. EC2 SSM setup

The EC2 instance runs the Amazon SSM Agent.

Its systemd service is:

```text
snap.amazon-ssm-agent.amazon-ssm-agent.service
```

A useful check on EC2 is:

```bash
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service
```

The instance should also appear as an online managed node in AWS Systems Manager.

The EC2 role:

```text
SourceLearnEC2Role
```

has the AWS-managed policy:

```text
AmazonSSMManagedInstanceCore
```

This allows the instance to register with Systems Manager and receive commands.

---

# 9. Backend deployment command

GitHub sends an `AWS-RunShellScript` command through SSM.

The deployment effectively does:

```bash
cd /home/ubuntu/SourceLearn

git fetch origin <deployment-branch>
git reset --hard origin/<deployment-branch>

cd backend

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up --build -d
```

`git reset --hard` is used intentionally on the deployment machine.

The EC2 checkout is treated as a deployment copy, not as a place to make source-code edits.

---

# 10. Preserving PostgreSQL data

The deployment workflow does **not** run:

```bash
docker compose down -v
```

That matters because `-v` would remove Docker volumes.

The deployment simply rebuilds/recreates the necessary containers with:

```bash
docker compose ... up --build -d
```

so the PostgreSQL data volume is preserved.

---

# 11. Waiting for the SSM deployment

`ssm:SendCommand` starts the deployment asynchronously.

GitHub Actions captures the returned command ID and polls:

```text
ssm:GetCommandInvocation
```

until the status becomes one of:

```text
Success
Failed
Cancelled
TimedOut
```

If the command fails, the workflow prints the SSM stdout/stderr and fails the GitHub Actions job.

This makes deployment failures visible in GitHub rather than silently failing on EC2.

---

# 12. Backend deployment health check

After Docker Compose starts the containers, the SSM command waits for FastAPI to respond.

The workflow checks the local backend from inside EC2 before declaring the deployment successful.

SourceLearn also exposes a lightweight health endpoint:

```text
GET /health
```

which returns:

```json
{
  "status": "ok"
}
```

This endpoint is useful for deployment verification and infrastructure health checks.

---

# 13. Concurrency

Both deployment workflows define a concurrency group.

Example:

```yaml
concurrency:
  group: deploy-frontend-${{ github.ref }}
  cancel-in-progress: true
```

This prevents multiple outdated deployments of the same branch from running at the same time.

If another commit arrives while an older deployment is still running, GitHub can cancel the old run and deploy the newer commit instead.

---

# 14. Secrets and credentials

The deployment setup intentionally avoids long-lived AWS credentials in GitHub.

Do not add these as GitHub secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
EC2 .pem private key
```

AWS authentication comes from GitHub OIDC.

Application secrets such as the Gemini API key remain on the EC2 environment and are not part of the repository.

---

# 15. Testing the CD pipelines

Both pipelines were verified using normal application changes rather than only workflow-file changes.

Frontend verification:

1. a new Quick Tip was committed
2. the frontend deploy workflow ran
3. tests/build passed
4. the build was synced to S3
5. CloudFront was invalidated
6. the new Quick Tip appeared on the live site

Backend verification:

1. a small `/health` endpoint was committed
2. the backend deploy workflow ran
3. Pytest passed
4. GitHub authenticated to AWS through OIDC
5. SSM deployed the new commit to EC2
6. Docker Compose rebuilt the backend
7. the live health endpoint returned `{"status":"ok"}`

This verifies that both deployment paths respond to normal source-code changes.

---

# 16. Typical development flow

The intended repository workflow is:

```text
feature branch
      |
      v
pull request
      |
      v
CI
      |
      v
merge into deployment branch
      |
      +--> frontend CD when frontend changed
      |
      +--> backend CD when backend changed
      |
      v
AWS
```

The branch name is controlled by the `on.push.branches` setting in each deployment workflow.

For example:

```yaml
on:
  push:
    branches:
      - main
```

This makes the deployment strategy easy to move between an integration branch and `main` without changing the deployment logic itself.

---

## Quick reference

```text
ci.yml
  -> backend Pytest
  -> frontend TypeScript + Vitest

deploy-frontend.yml
  -> frontend tests
  -> Vite build
  -> GitHub OIDC
  -> S3 sync --delete
  -> CloudFront invalidation

deploy-backend.yml
  -> Pytest
  -> GitHub OIDC
  -> SSM Run Command
  -> EC2 git update
  -> Docker Compose rebuild
  -> backend verification

SourceLearnGitHubActionsRole
  -> assumed by GitHub through OIDC
  -> frontend S3/CloudFront permissions
  -> backend SSM deployment permissions

SourceLearnEC2Role
  -> S3 document access
  -> AmazonSSMManagedInstanceCore
```
