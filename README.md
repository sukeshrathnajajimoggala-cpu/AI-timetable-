# AI Timetable Conflict Resolver

A timetable scheduling application with a FastAPI backend and a React + Vite frontend. The project uses a genetic algorithm to resolve timetable conflicts and provides CRUD endpoints for professors, rooms, and courses.

## Features

- FastAPI backend with REST endpoints
- Genetic algorithm-based timetable solver
- React + Vite frontend for timetable visualization and management
- CRUD support for professors, rooms, and courses
- Conflict detection and schedule evaluation
- In-memory data store with reset support

## Repository structure

- `backend/` - FastAPI service and solver implementation
- `frontend/` - React + Vite application

## Backend setup

1. Create and activate a virtual environment:

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

2. Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Run the backend:

```bash
cd backend
uvicorn main:app --reload
```

The backend runs on `http://127.0.0.1:8000`.

## Frontend setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the frontend development server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## API endpoints

- `GET /api/data` - fetch current timetable data and conflicts
- `POST /api/reset` - reset data to default sample data
- `POST /api/solve` - run the genetic solver on the current timetable
- `POST /api/professors` - add a professor
- `DELETE /api/professors/{prof_id}` - delete a professor
- `POST /api/rooms` - add a room
- `DELETE /api/rooms/{room_id}` - delete a room
- `POST /api/courses` - add a course
- `DELETE /api/courses/{course_id}` - delete a course
- `POST /api/schedule/update` - update a schedule session manually

## Deployment on Render

The backend can be deployed to Render using the included `render.yaml` service definition.

1. Create a Render account and connect your GitHub repository.
2. Add a new web service and choose the `main` branch.
3. Render should automatically detect `render.yaml` and configure the service.
4. If you configure manually, use these settings:

- Environment: `Python`
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Auto deploy: enabled

The API will be available at the Render service URL once the deployment completes.

## Notes

- CORS is enabled on the backend to allow frontend integration.
- The repository uses an in-memory data store and resets on server restart.
