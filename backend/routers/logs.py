from fastapi import APIRouter, HTTPException, Depends, Query
from db import get_connection
from schemas import WorkoutLogCreate, WorkoutLogOut, PaginatedLogs, UnitEnum
from routers.auth import verify_token
from typing import Optional
from datetime import date
import math

router = APIRouter()
LB_TO_KG = 0.453592


def compute_volume(sets: int, reps: int, weight_kg: float, unit: str) -> float:
    if unit == "lb":
        weight_kg = weight_kg * LB_TO_KG
    elif unit == "BW":
        weight_kg = 0
    return sets * reps * weight_kg


def _enrich_log(conn, row) -> dict:
    d = dict(row)
    # muscle group
    mg = conn.execute("SELECT * FROM muscle_groups WHERE id=?", (d["muscle_group_id"],)).fetchone()
    d["muscle_group"] = {"id": mg["id"], "name": mg["name"], "color_hex": mg["color_hex"], "icon": mg["icon"]} if mg else None
    # exercise (with its muscle group)
    ex = conn.execute("SELECT * FROM exercises WHERE id=?", (d["exercise_id"],)).fetchone()
    if ex:
        ex_mg = conn.execute("SELECT * FROM muscle_groups WHERE id=?", (ex["muscle_group_id"],)).fetchone()
        d["exercise"] = {
            "id": ex["id"], "name": ex["name"], "muscle_group_id": ex["muscle_group_id"],
            "equipment": ex["equipment"], "primary_muscles": ex["primary_muscles"],
            "cues": ex["cues"], "image_url": ex["image_url"], "video_url": ex["video_url"],
            "reference_link": ex["reference_link"], "is_active": bool(ex["is_active"]),
            "created_at": ex["created_at"],
            "muscle_group": {"id": ex_mg["id"], "name": ex_mg["name"],
                             "color_hex": ex_mg["color_hex"], "icon": ex_mg["icon"]} if ex_mg else None
        }
    else:
        d["exercise"] = None
    return d


@router.post("/logs", response_model=WorkoutLogOut)
async def create_log(body: WorkoutLogCreate, _=Depends(verify_token)):
    week_number = body.date.isocalendar()[1]
    total_volume = compute_volume(body.sets, body.reps, body.weight_kg, body.unit)

    conn = get_connection()
    try:
        cur = conn.execute(
            """INSERT INTO workout_logs (date, week_number, muscle_group_id, exercise_id,
               sets, reps, weight_kg, unit, form_rating, energy_level, notes, total_volume_kg)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (str(body.date), week_number, body.muscle_group_id, body.exercise_id,
             body.sets, body.reps, body.weight_kg, body.unit,
             body.form_rating, body.energy_level, body.notes, total_volume)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM workout_logs WHERE id=?", (cur.lastrowid,)).fetchone()
        return _enrich_log(conn, row)
    finally:
        conn.close()


@router.get("/logs", response_model=PaginatedLogs)
async def get_logs(
    log_date: Optional[date] = Query(None, alias="date"),
    muscle_group_id: Optional[int] = None,
    exercise_id: Optional[int] = None,
    page: int = 1,
    limit: int = 20,
    _=Depends(verify_token)
):
    conditions = ["1=1"]
    params = []
    if log_date:
        conditions.append("date = ?")
        params.append(str(log_date))
    if muscle_group_id:
        conditions.append("muscle_group_id = ?")
        params.append(muscle_group_id)
    if exercise_id:
        conditions.append("exercise_id = ?")
        params.append(exercise_id)

    where = " AND ".join(conditions)
    conn = get_connection()
    try:
        total = conn.execute(f"SELECT COUNT(*) FROM workout_logs WHERE {where}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM workout_logs WHERE {where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?",
            params + [limit, (page - 1) * limit]
        ).fetchall()
        items = [_enrich_log(conn, r) for r in rows]
        return PaginatedLogs(
            items=items, total=total, page=page, limit=limit,
            pages=math.ceil(total / limit) if total else 1
        )
    finally:
        conn.close()


@router.delete("/logs/{log_id}")
async def delete_log(log_id: int, _=Depends(verify_token)):
    conn = get_connection()
    row = conn.execute("SELECT id FROM workout_logs WHERE id=?", (log_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Log not found")
    conn.execute("DELETE FROM workout_logs WHERE id=?", (log_id,))
    conn.commit()
    conn.close()
    return {"message": "Log deleted"}
