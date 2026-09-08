# SourceLearn

## Run the application

From the project root, start PostgreSQL, the FastAPI backend, and the Vite frontend with:

```bash
./start.sh
```

Open <http://localhost:3000> in your browser. Press `Ctrl+C` to stop the frontend, backend, and PostgreSQL container.

The script uses `backend/.venv` when it is available and expects frontend dependencies to already be installed in `frontend/node_modules`.
