# Local Setup & Developer Guide

This guide walks through setting up, configuring, and running **SourceLearn** locally for development or demonstration.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Docker** & **Docker Compose** (for PostgreSQL with `pgvector`)
- **Python 3.11+** (for FastAPI backend)
- **Node.js 20+** & **npm** (for Vite React frontend)
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

---

## 2. Fast Launch (1-Command Startup)

The repository provides a unified orchestration script `start.sh` that checks requirements, boots Docker PostgreSQL, starts the FastAPI server, and launches the Vite frontend:

```bash
chmod +x start.sh
./start.sh
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8082`
- **Swagger Docs**: `http://localhost:8082/docs`

> Press `Ctrl+C` in your terminal to gracefully shut down the frontend, backend, and PostgreSQL container.

---

## 3. Manual Step-by-Step Setup

If you prefer running services independently in separate terminal windows:

### Step 1: Start PostgreSQL + pgvector
```bash
cd backend
docker compose up -d
```
Verify the container is healthy:
```bash
docker ps
```
The database runs on port `5433` (avoiding conflicts with any default system PostgreSQL running on `5432`).

### Step 2: Configure Environment Variables
Inside `backend/`:
Create a `.env` file (or copy `.env.example`):
```bash
DATABASE_URL=postgresql://user:password@localhost:5433/study_assistant
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Install Backend Dependencies & Start FastAPI
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8082 --reload
```

### Step 4: Install Frontend Dependencies & Start Vite
```bash
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 4. Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with psycopg3 driver | `postgresql://user:password@localhost:5433/study_assistant` |
| `GEMINI_API_KEY` | Google Gemini API key for query rewriting and answer synthesis | `AIzaSy...` |

---

## 5. Verification & Testing

### TypeScript Compiler Check
```bash
cd frontend
npx tsc -b --noEmit
```

### Frontend Automated Tests
```bash
cd frontend
npm test
```


### Backend Syntax & Imports
```bash
cd backend
python3 -m py_compile app/main.py
```

### Backend Automated Tests
```bash
cd backend
source .venv/bin/activate
pytest tests -v
```


### Check Running Endpoints
```bash
curl -I http://localhost:8082/notebooks/
curl -I http://localhost:3000/
```

---

## 6. Troubleshooting FAQ

#### Issue: `FATAL: password authentication failed for user "user"`
**Solution**: If an old Docker volume with different credentials exists, reset the container and volume:
```bash
cd backend
docker compose down -v
docker compose up -d
```

#### Issue: `GEMINI_API_KEY is not configured`
**Solution**: Ensure your `.env` file exists in `backend/` and contains a valid API key from Google AI Studio.

#### Issue: Port 3000 or 8082 already in use
**Solution**: Check for existing processes using `lsof -i :3000` or `lsof -i :8082` and terminate them before launching.
