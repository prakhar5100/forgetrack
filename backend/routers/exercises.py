from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from db import get_connection
from schemas import ExerciseOut, MuscleGroupOut
from routers.auth import verify_token
from typing import List, Optional
import os
import aiofiles
import uuid

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# Cloudflare R2 config (S3-compatible)
R2_ACCOUNT_ID  = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY  = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY  = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET      = os.getenv("R2_BUCKET_NAME", "")
R2_PUBLIC_URL  = os.getenv("R2_PUBLIC_URL", "")  # e.g. https://pub-xxx.r2.dev


async def save_upload(file: UploadFile) -> str:
    """Upload a file to R2 (production) or local disk (dev). Returns a public URL."""
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    filename = f"{uuid.uuid4()}{ext}"
    content = await file.read()

    if R2_ACCOUNT_ID and R2_ACCESS_KEY and R2_BUCKET:
        # ── Production: Cloudflare R2 (S3-compatible) ─────────────────────────
        import boto3
        from botocore.client import Config

        s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=filename,
            Body=content,
            ContentType=file.content_type or "application/octet-stream",
        )
        return f"{R2_PUBLIC_URL.rstrip('/')}/{filename}"
    else:
        # ── Local dev: save to disk ────────────────────────────────────────────
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        path = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(path, "wb") as f:
            await f.write(content)
        return f"/uploads/{filename}"


def _row_to_exercise(row, mg_row=None) -> dict:
    d = dict(row)
    d["is_active"] = bool(d["is_active"])
    if mg_row:
        d["muscle_group"] = {"id": mg_row["id"], "name": mg_row["name"],
                             "color_hex": mg_row["color_hex"], "icon": mg_row["icon"]}
    return d


@router.get("/exercises", response_model=List[ExerciseOut])
async def get_exercises(
    muscle_group_id: Optional[int] = None,
    active_only: bool = True,
    _=Depends(verify_token)
):
    conn = get_connection()
    sql = """
        SELECT e.*, mg.id as mg_id, mg.name as mg_name, mg.color_hex, mg.icon
        FROM exercises e
        JOIN muscle_groups mg ON mg.id = e.muscle_group_id
        WHERE 1=1
    """
    params = []
    if active_only:
        sql += " AND e.is_active = 1"
    if muscle_group_id:
        sql += " AND e.muscle_group_id = ?"
        params.append(muscle_group_id)
    sql += " ORDER BY e.name"
    rows = conn.execute(sql, params).fetchall()
    conn.close()

    result = []
    for r in rows:
        d = {
            "id": r["id"], "name": r["name"], "muscle_group_id": r["muscle_group_id"],
            "equipment": r["equipment"], "primary_muscles": r["primary_muscles"],
            "cues": r["cues"], "image_url": r["image_url"], "video_url": r["video_url"],
            "reference_link": r["reference_link"], "is_active": bool(r["is_active"]),
            "created_at": r["created_at"],
            "muscle_group": {"id": r["mg_id"], "name": r["mg_name"],
                             "color_hex": r["color_hex"], "icon": r["icon"]}
        }
        result.append(d)
    return result


@router.post("/exercises", response_model=ExerciseOut)
async def create_exercise(
    name: str = Form(...),
    muscle_group_id: int = Form(...),
    equipment: Optional[str] = Form(None),
    primary_muscles: Optional[str] = Form(None),
    cues: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    reference_link: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    _=Depends(verify_token)
):
    image_url = None
    if image and image.filename:
        image_url = await save_upload(image)

    conn = get_connection()
    try:
        cur = conn.execute(
            """INSERT INTO exercises (name, muscle_group_id, equipment, primary_muscles, cues,
               image_url, video_url, reference_link) VALUES (?,?,?,?,?,?,?,?)""",
            (name, muscle_group_id, equipment, primary_muscles, cues, image_url, video_url, reference_link)
        )
        conn.commit()
        eid = cur.lastrowid
        row = conn.execute("""
            SELECT e.*, mg.id as mg_id, mg.name as mg_name, mg.color_hex, mg.icon
            FROM exercises e JOIN muscle_groups mg ON mg.id = e.muscle_group_id
            WHERE e.id=?""", (eid,)).fetchone()
        return {
            "id": row["id"], "name": row["name"], "muscle_group_id": row["muscle_group_id"],
            "equipment": row["equipment"], "primary_muscles": row["primary_muscles"],
            "cues": row["cues"], "image_url": row["image_url"], "video_url": row["video_url"],
            "reference_link": row["reference_link"], "is_active": bool(row["is_active"]),
            "created_at": row["created_at"],
            "muscle_group": {"id": row["mg_id"], "name": row["mg_name"],
                             "color_hex": row["color_hex"], "icon": row["icon"]}
        }
    finally:
        conn.close()


@router.put("/exercises/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
    exercise_id: int,
    name: Optional[str] = Form(None),
    muscle_group_id: Optional[int] = Form(None),
    equipment: Optional[str] = Form(None),
    primary_muscles: Optional[str] = Form(None),
    cues: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    reference_link: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    _=Depends(verify_token)
):
    conn = get_connection()
    try:
        ex = conn.execute("SELECT * FROM exercises WHERE id=?", (exercise_id,)).fetchone()
        if not ex:
            raise HTTPException(status_code=404, detail="Exercise not found")

        updates = {}
        if name is not None: updates["name"] = name
        if muscle_group_id is not None: updates["muscle_group_id"] = muscle_group_id
        if equipment is not None: updates["equipment"] = equipment
        if primary_muscles is not None: updates["primary_muscles"] = primary_muscles
        if cues is not None: updates["cues"] = cues
        if video_url is not None: updates["video_url"] = video_url
        if reference_link is not None: updates["reference_link"] = reference_link
        if image and image.filename:
            updates["image_url"] = await save_upload(image)

        if updates:
            set_clause = ", ".join(f"{k}=?" for k in updates)
            conn.execute(f"UPDATE exercises SET {set_clause} WHERE id=?",
                         list(updates.values()) + [exercise_id])
            conn.commit()

        row = conn.execute("""
            SELECT e.*, mg.id as mg_id, mg.name as mg_name, mg.color_hex, mg.icon
            FROM exercises e JOIN muscle_groups mg ON mg.id = e.muscle_group_id
            WHERE e.id=?""", (exercise_id,)).fetchone()
        return {
            "id": row["id"], "name": row["name"], "muscle_group_id": row["muscle_group_id"],
            "equipment": row["equipment"], "primary_muscles": row["primary_muscles"],
            "cues": row["cues"], "image_url": row["image_url"], "video_url": row["video_url"],
            "reference_link": row["reference_link"], "is_active": bool(row["is_active"]),
            "created_at": row["created_at"],
            "muscle_group": {"id": row["mg_id"], "name": row["mg_name"],
                             "color_hex": row["color_hex"], "icon": row["icon"]}
        }
    finally:
        conn.close()


@router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: int, _=Depends(verify_token)):
    conn = get_connection()
    ex = conn.execute("SELECT id FROM exercises WHERE id=?", (exercise_id,)).fetchone()
    if not ex:
        conn.close()
        raise HTTPException(status_code=404, detail="Exercise not found")
    conn.execute("UPDATE exercises SET is_active=0 WHERE id=?", (exercise_id,))
    conn.commit()
    conn.close()
    return {"message": "Exercise deactivated"}
