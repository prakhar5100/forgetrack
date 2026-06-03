from fastapi import APIRouter, Depends
from db import get_connection
from schemas import WeightProgress, VolumeProgress, FormBreakdown, DashboardSummary
from routers.auth import verify_token
from typing import List
from datetime import date, timedelta

router = APIRouter()


@router.get("/progress/weight", response_model=List[WeightProgress])
async def weight_progress(exercise_id: int, _=Depends(verify_token)):
    conn = get_connection()
    rows = conn.execute("""
        SELECT week_number, CAST(strftime('%Y', date) AS INTEGER) as year,
               MAX(weight_kg) as max_weight, MIN(date) as date
        FROM workout_logs
        WHERE exercise_id = ?
        GROUP BY week_number, strftime('%Y', date)
        ORDER BY strftime('%Y', date), week_number
    """, (exercise_id,)).fetchall()
    conn.close()
    return [WeightProgress(week=r["week_number"], year=r["year"],
                           max_weight=r["max_weight"], date=r["date"]) for r in rows]


@router.get("/progress/volume", response_model=List[VolumeProgress])
async def volume_progress(exercise_id: int, _=Depends(verify_token)):
    conn = get_connection()
    rows = conn.execute("""
        SELECT week_number, CAST(strftime('%Y', date) AS INTEGER) as year,
               SUM(total_volume_kg) as total_volume
        FROM workout_logs
        WHERE exercise_id = ?
        GROUP BY week_number, strftime('%Y', date)
        ORDER BY strftime('%Y', date), week_number
    """, (exercise_id,)).fetchall()
    conn.close()
    return [VolumeProgress(week=r["week_number"], year=r["year"],
                           total_volume=r["total_volume"] or 0) for r in rows]


@router.get("/progress/form", response_model=List[FormBreakdown])
async def form_progress(exercise_id: int, _=Depends(verify_token)):
    conn = get_connection()
    rows = conn.execute("""
        SELECT week_number, CAST(strftime('%Y', date) AS INTEGER) as year,
               form_rating, COUNT(*) as cnt
        FROM workout_logs
        WHERE exercise_id = ? AND form_rating IS NOT NULL
        GROUP BY week_number, strftime('%Y', date), form_rating
        ORDER BY strftime('%Y', date), week_number
    """, (exercise_id,)).fetchall()
    conn.close()

    weeks: dict = {}
    for r in rows:
        key = (r["week_number"], r["year"])
        if key not in weeks:
            weeks[key] = FormBreakdown(week=r["week_number"], year=r["year"])
        setattr(weeks[key], r["form_rating"], getattr(weeks[key], r["form_rating"]) + r["cnt"])
    return list(weeks.values())


@router.get("/stats/summary", response_model=DashboardSummary)
async def summary(_=Depends(verify_token)):
    today = date.today()
    week_num = today.isocalendar()[1]
    year = today.year

    conn = get_connection()

    total_volume_week = conn.execute("""
        SELECT COALESCE(SUM(total_volume_kg), 0) FROM workout_logs
        WHERE week_number=? AND strftime('%Y', date)=?
    """, (week_num, str(year))).fetchone()[0]

    sessions_week = conn.execute("""
        SELECT COUNT(DISTINCT date) FROM workout_logs
        WHERE week_number=? AND strftime('%Y', date)=?
    """, (week_num, str(year))).fetchone()[0]

    total_sessions = conn.execute(
        "SELECT COUNT(DISTINCT date) FROM workout_logs"
    ).fetchone()[0]

    # Streak calculation
    all_dates = [r[0] for r in conn.execute(
        "SELECT DISTINCT date FROM workout_logs ORDER BY date DESC"
    ).fetchall()]
    streak = 0
    check = today
    for d_str in all_dates:
        d = date.fromisoformat(d_str)
        if d == check or d == check - timedelta(days=1):
            streak += 1
            check = d
        else:
            break

    # Last trained per muscle group
    mg_rows = conn.execute("""
        SELECT mg.id, mg.name, mg.color_hex, mg.icon, MAX(wl.date) as last_trained
        FROM muscle_groups mg
        LEFT JOIN workout_logs wl ON wl.muscle_group_id = mg.id
        GROUP BY mg.id, mg.name, mg.color_hex, mg.icon
        ORDER BY mg.id
    """).fetchall()

    muscle_group_last_trained = []
    for r in mg_rows:
        last = date.fromisoformat(r["last_trained"]) if r["last_trained"] else None
        muscle_group_last_trained.append({
            "id": r["id"], "name": r["name"], "color_hex": r["color_hex"], "icon": r["icon"],
            "last_trained": r["last_trained"],
            "days_since": (today - last).days if last else None,
        })

    conn.close()
    return DashboardSummary(
        total_volume_week=round(total_volume_week, 1),
        sessions_week=sessions_week,
        streak=streak,
        total_sessions_all_time=total_sessions,
        muscle_group_last_trained=muscle_group_last_trained,
    )
