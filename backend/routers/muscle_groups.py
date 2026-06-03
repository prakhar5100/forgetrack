from fastapi import APIRouter, HTTPException, Depends
from db import get_connection
from schemas import MuscleGroupOut, MuscleGroupCreate
from routers.auth import verify_token
from typing import List

router = APIRouter()


def _row_to_mg(row) -> dict:
    return {"id": row["id"], "name": row["name"], "color_hex": row["color_hex"], "icon": row["icon"]}


@router.get("/muscle-groups", response_model=List[MuscleGroupOut])
async def get_muscle_groups(_=Depends(verify_token)):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM muscle_groups ORDER BY id").fetchall()
    conn.close()
    return [_row_to_mg(r) for r in rows]


@router.post("/muscle-groups", response_model=MuscleGroupOut)
async def create_muscle_group(body: MuscleGroupCreate, _=Depends(verify_token)):
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO muscle_groups (name, color_hex, icon) VALUES (?, ?, ?)",
            (body.name, body.color_hex, body.icon)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM muscle_groups WHERE id=?", (cur.lastrowid,)).fetchone()
        return _row_to_mg(row)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
