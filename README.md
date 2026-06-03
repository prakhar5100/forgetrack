# 🏋️ FORGETRACK — Full-Stack Workout Tracker

A polished, full-stack workout tracking application with a dark-themed UI, progress charts, exercise library, and photo tracking.

## Stack

| Layer       | Tech                                      |
|-------------|-------------------------------------------|
| Frontend    | React 18 + TypeScript + Vite              |
| Styling     | Tailwind CSS (custom design system)       |
| State       | TanStack Query (React Query v5)           |
| Charts      | Recharts                                  |
| Backend     | FastAPI (Python 3.11)                     |
| Database    | PostgreSQL 15 via SQLAlchemy (async)      |
| Migrations  | Alembic                                   |
| Auth        | JWT (single-user, env-var credentials)    |
| File upload | Local `/uploads` volume (S3-swappable)    |

---

## Quick Start (Docker)

```bash
# 1. Clone / place the project
cd workout-tracker

# 2. (Optional) copy and edit env vars
cp .env.example .env

# 3. Spin everything up
docker compose up --build

# Frontend → http://localhost:5173
# Backend  → http://localhost:8000/docs
```

Default login: **admin** / **workout**  
(Change via `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars)

---

## Local Development (no Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Start a local Postgres, then:
export DATABASE_URL=postgresql+asyncpg://workout:workout123@localhost:5432/workoutdb
export JWT_SECRET=devsecret
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=workout

alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Features

### Dashboard `/`
- Live week number + date header
- 4 stat cards: volume this week, sessions, streak, all-time
- **Muscle heatmap** — 6 cells, colour-coded green → yellow → red by days since last trained
- Recent logs table (last 10 entries)
- Floating **+ Log Workout** button

### Log Workout (slide-over panel)
- 4-step wizard: Date & Muscle → Exercise → Sets/Reps/Weight → Rating & Notes
- Auto-detects time-based exercises (Plank, Superman Hold) and labels field "Seconds"
- Live volume preview (sets × reps × weight)
- After save, resets to Step 2 so you can immediately log the next exercise in the same session
- Emoji pickers for Form Rating (🔥💪😐😓) and Energy Level (⚡🌤😴)

### Progress `/progress`
- Sidebar: filter by muscle group → exercise
- Line chart: max weight per week (with Personal Best reference line)
- Bar chart: total volume per week
- Stacked bar chart: form rating breakdown per week

### Exercise Library `/exercises`
- Grid view with image thumbnails, filterable by muscle group + search
- **Add / Edit** exercises via modal form with image upload
- **Soft delete** (preserves historical logs)
- Detail drawer: cues, YouTube embed or video link, reference link

### History `/history`
- Paginated full log table (20/page)
- Filter by muscle group, exercise, date
- **Export to CSV** (client-side, from current filtered view)
- Delete individual entries

### Progress Photos `/photos`
- Masonry grid of progress photos
- Upload with date, bodyweight, notes
- Drag-and-drop upload zone
- Full-screen lightbox viewer

---

## API Reference

```
POST   /api/auth/login
GET    /api/muscle-groups
GET    /api/exercises?muscle_group_id=&active_only=true
POST   /api/exercises                   (multipart/form-data)
PUT    /api/exercises/{id}              (multipart/form-data)
DELETE /api/exercises/{id}              → soft delete
POST   /api/logs
GET    /api/logs?date=&muscle_group_id=&exercise_id=&page=&limit=
DELETE /api/logs/{id}
GET    /api/progress/weight?exercise_id=
GET    /api/progress/volume?exercise_id=
GET    /api/progress/form?exercise_id=
GET    /api/stats/summary
GET    /api/progress-photos
POST   /api/progress-photos             (multipart/form-data)
DELETE /api/progress-photos/{id}
```

Interactive docs: **http://localhost:8000/docs**

---

## Seed Data

`seed.py` pre-populates:

- **6 Muscle Groups**: Legs, Abs, Chest, Back, Biceps, Triceps
- **22 Exercises** with equipment tags and coaching cues

Run manually: `python seed.py` (idempotent — skips if data exists)

---

## Project Structure

```
workout-tracker/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── main.py              # FastAPI app + CORS + static files
│   ├── db.py                # Async SQLAlchemy engine + session
│   ├── seed.py              # DB seed script
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── models/
│   │   └── __init__.py      # MuscleGroup, Exercise, WorkoutLog, ProgressPhoto
│   ├── schemas/
│   │   └── __init__.py      # Pydantic request/response models
│   ├── routers/
│   │   ├── auth.py
│   │   ├── muscle_groups.py
│   │   ├── exercises.py     # + file upload handling
│   │   ├── logs.py
│   │   ├── progress.py
│   │   └── photos.py
│   └── migrations/
│       ├── env.py
│       └── versions/001_initial.py
└── frontend/
    ├── Dockerfile
    ├── vite.config.ts       # Proxy /api → backend
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx           # Routes + auth guard
        ├── index.css
        ├── lib/api.ts        # Axios client + all TypeScript types
        ├── components/
        │   ├── Layout.tsx    # Sidebar + mobile nav
        │   └── LogWorkoutPanel.tsx  # 4-step slide-over
        └── pages/
            ├── Login.tsx
            ├── Dashboard.tsx
            ├── Progress.tsx
            ├── Exercises.tsx
            ├── History.tsx
            └── ProgressPhotos.tsx
```

---

## Customisation

**Change credentials**: Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your `.env` or `docker-compose.yml`.

**Add muscle groups**: Insert rows into `muscle_groups` table or extend `seed.py`.

**S3 uploads**: Replace `save_upload()` in `routers/exercises.py` and `routers/photos.py` with `boto3` calls; update `image_url` to return the S3 public URL.
