# AWS Integration Guide

This is the informal walkthrough for how SourceLearn was moved from a local-only app to a deployed AWS setup.

It is intentionally written more like a setup / recovery guide than polished architecture documentation. The idea is that if I come back to this project later, I should be able to remember what was done, why it was done, and roughly how to rebuild it.

---

## What the AWS setup looks like

At the moment, SourceLearn is split across AWS like this:

```text
Browser
  |
  | HTTPS
  v
CloudFront (frontend)
  |
  v
Private S3 bucket
  - React / Vite build files

Browser
  |
  | HTTPS API requests
  v
CloudFront (backend)
  |
  | HTTP :8000
  v
EC2
  |
  +-- FastAPI container
  |
  +-- PostgreSQL + pgvector container
  |
  +-- Adminer container
  |
  +-- IAM role -> private document S3 bucket

FastAPI
  |
  +-- Gemini API
  |
  +-- PostgreSQL / pgvector
  |
  +-- S3 PDF storage
```

The important design choice is that uploaded PDFs no longer live on the EC2 filesystem. They live in S3, while PostgreSQL only stores the S3 object key.

---

# 1. Moving PDF storage from local disk to S3

Originally SourceLearn saved PDFs under a local `uploads/` directory.

That worked locally, but it is not a great deployment setup because the files would be tied to one machine/container.

The new flow is:

```text
PDF upload
   |
   +--> S3 stores the actual PDF
   |
   +--> PyMuPDF extracts text from the bytes
            |
            v
       chunk + embed
            |
            v
     PostgreSQL / pgvector
```

The document row now stores:

```text
id
notebook_id
file_name
s3_key
```

instead of a local `file_path`.

Example key:

```text
notebooks/4/documents/<uuid>_lecture.pdf
```

The bucket currently used for uploaded study documents is:

```text
sourcelearn-documents-2026
```

The bucket is private.

---

## S3 service

The backend has:

```text
backend/app/services/s3_service.py
```

It wraps the three operations SourceLearn needs:

- upload object
- get object
- delete object

Boto3 is intentionally allowed to use its normal credential chain.

That means local development can use environment credentials, while EC2 can use an IAM role without changing application code.

The backend environment needs:

```env
AWS_REGION=ca-central-1
S3_BUCKET_NAME=sourcelearn-documents-2026
```

Local development can also provide:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

These values must stay in a local `.env` file and must never be committed.

On EC2, **do not provide access keys**. The instance role handles authentication.

---

## Upload flow

`POST /notebooks/{notebook_id}/documents` now:

1. reads the uploaded PDF into memory
2. creates a safe UUID-prefixed S3 key
3. uploads the bytes to S3
4. extracts PDF text
5. chunks it
6. generates embeddings
7. writes the document + chunks to PostgreSQL

The upload is inside a `try` block so that if extraction, embedding, or database work fails after S3 upload, the S3 object is deleted again.

That avoids leaving orphaned files in the bucket.

---

## PDF viewing and citations

The frontend PDF viewer did not need to know anything about S3.

It still requests:

```text
GET /documents/{document_id}/file
```

The backend now:

1. loads the PDF bytes from S3 using `document.s3_key`
2. optionally highlights the citation snippet with PyMuPDF
3. returns the PDF bytes with `media_type="application/pdf"`

So the frontend still just receives a normal PDF response.

---

## Delete flow

Deleting a document now removes the S3 object before removing its database record.

If S3 deletion fails, the API aborts instead of deleting the database row and leaving an orphaned cloud file.

Notebook deletion also removes every document object from S3 before removing the related database rows.

One unavoidable caveat: S3 and PostgreSQL are separate systems, so there is no single atomic transaction covering both of them. The code minimizes the risk and explicitly rolls back database work when an S3 failure occurs.

---

# 2. Local AWS access

For local development, an IAM user was created specifically for SourceLearn.

The policy is intentionally limited to the document bucket instead of using `AmazonS3FullAccess`.

The policy is basically:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::sourcelearn-documents-2026"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::sourcelearn-documents-2026/*"
    }
  ]
}
```

The local S3 integration was tested by uploading, reading, and deleting a small object through `boto3`.

---

# 3. EC2 backend deployment

The backend is deployed on an Ubuntu EC2 instance in:

```text
ca-central-1
```

The instance type used during setup was:

```text
t3.small
```

The EC2 machine runs Docker and Docker Compose.

The backend stack is:

```text
FastAPI
PostgreSQL 17 + pgvector
Adminer
```

all through Docker Compose.

PostgreSQL is not supposed to be publicly exposed for normal application access.

---

## SSH

A key pair was created for connecting to the instance.

Typical connection:

```bash
chmod 400 sourcelearn-ec2.pem

ssh -i sourcelearn-ec2.pem ubuntu@<EC2_PUBLIC_IP>
```

The EC2 public IP can change if the instance is stopped and started again unless an Elastic IP is attached, so do not hardcode it into long-term configuration.

---

## Installing Docker

Docker and Docker Compose were installed on EC2 and the `ubuntu` user was added to the Docker group.

Useful checks:

```bash
docker --version
docker compose version
```

---

# 4. EC2 IAM role for S3

The EC2 instance has an IAM role:

```text
SourceLearnEC2Role
```

The role has permission to access only the SourceLearn document bucket.

This is much better than copying AWS access keys onto the server.

The role was verified from the instance with:

```bash
aws sts get-caller-identity
```

and S3 access was verified with:

```bash
aws s3 ls s3://sourcelearn-documents-2026
```

If those commands work without manually configuring credentials, the instance role is working.

---

# 5. Running SourceLearn on EC2

The repository is cloned onto EC2 and the `aws-integration` branch is checked out.

The production backend `.env` contains values such as:

```env
GEMINI_API_KEY=...
AWS_REGION=ca-central-1
S3_BUCKET_NAME=sourcelearn-documents-2026
```

There should be **no AWS access key or secret key** in the EC2 `.env`.

The database URL is currently supplied by Docker Compose because the FastAPI container talks to the Postgres container over the Compose network.

---

# 6. Local vs production Docker Compose

Local development and EC2 use the same base Compose file, but production applies an override.

Base file:

```text
backend/docker-compose.yml
```

Production override:

```text
backend/docker-compose.prod.yml
```

The production override is intentionally tiny:

```yaml
services:
  backend:
    command: ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    volumes: []
```

Why?

Local development wants:

- source code bind-mounted into the container
- Uvicorn `--reload`

Production wants:

- application code baked into the Docker image
- no bind mount
- no `--reload`

Local:

```bash
docker compose up
```

EC2:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up --build -d
```

Useful checks:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  ps

docker logs sourcelearn-backend
```

A healthy backend should eventually show:

```text
Application startup complete.
Uvicorn running on http://0.0.0.0:8000
```

and should **not** show a Uvicorn reload watcher in production.

---

# 7. One deployment issue we hit: disk space

The first Docker build failed with:

```text
No space left on device
```

A major reason was the old `sentence-transformers` dependency pulling in very large ML packages even though SourceLearn already uses Gemini for embeddings.

That unused dependency was removed.

This made the Docker image much smaller and the EC2 build succeeded.

Useful disk checks:

```bash
df -h
docker system df
```

Useful cleanup command for failed Docker builds:

```bash
docker system prune -af
```

---

# 8. Testing the deployed backend

Before touching the frontend, the backend was tested directly through FastAPI Swagger.

The deployment was considered working after testing:

1. create notebook
2. upload PDF
3. verify PDF appeared in S3
4. get notebook documents
5. delete document
6. verify PDF disappeared from S3

That proved this path:

```text
Browser
  -> EC2 FastAPI
  -> PostgreSQL / pgvector
  -> S3 through EC2 IAM role
```

---

# 9. Frontend production environment

The frontend already supports a configurable API URL in:

```text
frontend/src/api/client.ts
```

It uses:

```text
VITE_API_URL
```

with localhost as the development fallback.

For production, create:

```text
frontend/.env.production
```

with:

```env
VITE_API_URL=https://<BACKEND_CLOUDFRONT_DOMAIN>
```

Then build locally on the Mac:

```bash
cd frontend
npm run build
```

Vite creates:

```text
frontend/dist/
```

---

# 10. Frontend S3 bucket

A second S3 bucket is used for the static frontend:

```text
sourcelearn-frontend-2026
```

This is separate from the private PDF/document bucket because the two buckets serve completely different purposes.

The frontend bucket remains private.

The **contents** of `frontend/dist/` are uploaded to the bucket root.

Correct:

```text
sourcelearn-frontend-2026/
  index.html
  favicon.svg
  icons.svg
  assets/
```

Wrong:

```text
sourcelearn-frontend-2026/
  dist/
    index.html
    assets/
```

---

# 11. Frontend CloudFront distribution

A CloudFront distribution sits in front of the private frontend S3 bucket.

CloudFront was configured to access the bucket privately rather than making the S3 bucket public.

Important setting:

```text
Default root object: index.html
```

This lets the CloudFront root URL load the React application.

After replacing frontend files in S3, invalidate CloudFront with:

```text
/*
```

so users receive the newest `index.html` and JS bundle.

Later, CD should automate this with something like:

```bash
aws s3 sync dist/ s3://sourcelearn-frontend-2026 --delete
```

followed by a CloudFront invalidation.

---

# 12. Why the frontend could not initially reach the backend

The first frontend deployment loaded correctly but displayed:

```text
Unable to connect to the server
```

The frontend itself was fine.

The problem was:

```text
Frontend: HTTPS CloudFront
Backend:  HTTP EC2:8000
```

Browsers block that as mixed content.

The solution was to put another CloudFront distribution in front of the FastAPI backend.

---

# 13. Backend CloudFront distribution

The backend CloudFront distribution uses the EC2 public DNS name as a custom origin.

The important settings are:

```text
Origin type:
Other

Origin:
EC2 public DNS name

Origin protocol:
HTTP only

Origin HTTP port:
8000

Viewer protocol policy:
Redirect HTTP to HTTPS

Allowed methods:
GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE

Cache policy:
CachingDisabled

Origin request policy:
AllViewerExceptHostHeader
```

This gives the browser an HTTPS API endpoint while CloudFront talks to EC2 over port 8000.

The frontend production env then points to:

```env
VITE_API_URL=https://<BACKEND_CLOUDFRONT_DOMAIN>
```

---

# 14. EC2 security group

During setup, SSH was restricted to the developer's IP.

Port 8000 was also initially restricted to the developer's IP for direct Swagger testing.

For CloudFront -> EC2 traffic, another inbound rule was added:

```text
Protocol: TCP
Port: 8000
Source: com.amazonaws.global.cloudfront.origin-facing
```

AWS represents this using a managed prefix list.

This means the backend does not need to expose port 8000 to the entire internet just so CloudFront can reach it.

Do **not** open PostgreSQL port 5432 publicly.

---

# 15. CORS

FastAPI must allow requests from the frontend CloudFront origin.

The frontend CloudFront HTTPS origin was added to:

```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://<FRONTEND_CLOUDFRONT_DOMAIN>",
]
```

Local development still works, while the deployed frontend can call the deployed API.

---

# 16. Updating the deployed backend manually

Until CD is added, the manual backend deployment flow is:

```bash
ssh -i sourcelearn-ec2.pem ubuntu@<EC2_PUBLIC_IP>

cd ~/SourceLearn
git pull
cd backend

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up --build -d
```

Then:

```bash
docker logs sourcelearn-backend
```

---

# 17. Updating the deployed frontend manually

Until CD is added:

```bash
cd frontend
npm run build
```

Then upload the contents of `dist/` to the frontend S3 bucket.

After the upload:

1. open the frontend CloudFront distribution
2. go to **Invalidations**
3. create an invalidation for:

```text
/*
```

The deployed frontend should then use the newest bundle.

---

# 18. Things that should never be committed

Do not commit:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
GEMINI_API_KEY
.pem SSH keys
real .env files
```

The repository `.gitignore` already ignores `.env`, `.env.*`, `*.pem`, and `*.key`.

`.env.example` is allowed and should only contain placeholders.

---

# 19. Tests added for the S3 work

The AWS integration tests mock S3 instead of making real AWS calls from CI.

Tests cover things such as:

- S3 upload called during document upload
- PDF bytes retrieved from S3
- S3 delete called during document deletion
- failed embedding / processing cleans up the uploaded S3 object
- failed S3 deletion preserves the database row
- deleting a notebook removes its S3 documents

CI should not need real AWS credentials.

Dummy environment values are supplied during tests so importing the backend does not try to use real secrets.

---

# 20. Current deployment checklist

At the end of this setup, the following were manually verified:

```text
Private document S3 bucket                  [x]
Boto3 S3 upload / read / delete             [x]
PostgreSQL stores s3_key                    [x]
EC2 instance                                [x]
EC2 IAM role                                [x]
Docker + Docker Compose                     [x]
FastAPI on EC2                              [x]
PostgreSQL + pgvector on EC2                [x]
Frontend production build                   [x]
Private frontend S3 bucket                  [x]
Frontend CloudFront HTTPS                   [x]
Backend CloudFront HTTPS                    [x]
CloudFront -> EC2 security group access     [x]
FastAPI CORS for deployed frontend          [x]
Create notebook from deployed UI            [x]
Upload PDF from deployed UI                 [x]
Ask questions / RAG from deployed UI        [x]
Citation PDF viewing                        [x]
Delete PDF and remove S3 object              [x]
```

---

# 21. What is still left

The big next step is **continuous deployment**.

Right now deployments still require manual work:

Backend:

```text
git pull -> docker compose build/up
```

Frontend:

```text
npm build -> S3 upload -> CloudFront invalidation
```

The next goal is to move those steps into GitHub Actions so pushes to the deployment branch can update AWS automatically.

That will complete the CI/CD portion of the project.

---

## Quick mental model

If I forget everything else, remember this:

```text
S3 #1 = private uploaded PDFs

EC2 = FastAPI + Postgres/pgvector

CloudFront #1 = HTTPS frontend
    -> private frontend S3

CloudFront #2 = HTTPS backend
    -> EC2 port 8000

IAM user = local development only

IAM role = EC2 production AWS access

GitHub Actions = next step
```
