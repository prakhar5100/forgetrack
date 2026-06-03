from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from db import init_db
from routers import auth, muscle_groups, exercises, logs, progress, photos

app = FastAPI(title="Workout Tracker API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
# Always allow local dev origins; add production Vercel URL via env var.
_allowed_origin = os.getenv("ALLOWED_ORIGIN", "")
origins = ["http://localhost:5173", "http://localhost:5174"]
if _allowed_origin:
    origins.append(_allowed_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file uploads (local dev only) ─────────────────────────────────────
# In production, files go to Cloudflare R2 — no local mount needed.
if not os.getenv("R2_ACCOUNT_ID"):
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(muscle_groups.router, prefix="/api")
app.include_router(exercises.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(photos.router, prefix="/api")


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
async def health():
    return {"status": "ok"}

