#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.yml"
BACKEND_PORT=8000
FRONTEND_PORT=5173

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is required but was not found in PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: Docker Compose is required but is not available." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but was not found in PATH." >&2
  exit 1
fi

if [[ -x "$BACKEND_DIR/.venv/bin/python" ]]; then
  PYTHON="$BACKEND_DIR/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON="$(command -v python3)"
else
  echo "Error: Python 3 was not found, and backend/.venv does not exist." >&2
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Error: frontend dependencies are missing. Run 'npm install' in frontend/ first." >&2
  exit 1
fi

backend_pid=""
frontend_pid=""

cleanup() {
  trap - EXIT INT TERM

  echo
  echo "Stopping SourceLearn..."

  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill "$frontend_pid" 2>/dev/null || true
  fi

  if [[ -n "$backend_pid" ]]; then
    wait "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "$frontend_pid" ]]; then
    wait "$frontend_pid" 2>/dev/null || true
  fi

  docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
}

handle_signal() {
  exit 130
}

trap cleanup EXIT
trap handle_signal INT TERM

# Ensure ports are free before starting
if command -v fuser >/dev/null 2>&1; then
  fuser -k "$BACKEND_PORT/tcp" "$FRONTEND_PORT/tcp" >/dev/null 2>&1 || true
fi

echo "Starting PostgreSQL and FastAPI (Docker)..."
docker compose -f "$COMPOSE_FILE" up -d --wait --wait-timeout 60 db backend

echo "Starting frontend on http://localhost:$FRONTEND_PORT..."
(
  cd "$FRONTEND_DIR"
  exec npm run dev -- --host 0.0.0.0
) &
frontend_pid=$!

echo "SourceLearn is running. Press Ctrl+C to stop the frontend, backend, and database."

set +e
exit_status=0
while true; do
  if ! kill -0 "$frontend_pid" 2>/dev/null; then
    wait "$frontend_pid" 2>/dev/null
    exit_status=$?
    break
  fi
  if [[ -z "$(docker compose -f "$COMPOSE_FILE" ps -q backend 2>/dev/null)" ]]; then
    echo "Backend container exited unexpectedly." >&2
    exit_status=1
    break
  fi
  sleep 1
done
set -e



if (( exit_status != 0 )); then
  echo "A SourceLearn service exited unexpectedly (status $exit_status)." >&2
fi

exit "$exit_status"
