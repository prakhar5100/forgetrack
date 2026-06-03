from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from db import get_connection
from schemas import ProgressPhotoOut
from routers.auth import verify_token
from routers.exercises import save_upload
from typing import List, Optional
from datetime import date

router = APIRouter()


@router.get("/progress-photos", response_model=List[ProgressPhotoOut])
async def get_photos(_=Depends(verify_token)):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM progress_photos ORDER BY date DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/progress-photos", response_model=ProgressPhotoOut)
async def upload_photo(
    photo_date: date = Form(...),
    weight_kg: Optional[float] = Form(None),
    notes: Optional[str] = Form(None),
    image: UploadFile = File(...),
    _=Depends(verify_token)
):
    image_url = await save_upload(image)
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO progress_photos (date, image_url, weight_kg, notes) VALUES (?,?,?,?)",
            (str(photo_date), image_url, weight_kg, notes)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM progress_photos WHERE id=?", (cur.lastrowid,)).fetchone()
        return dict(row)
    finally:
        conn.close()


@router.delete("/progress-photos/{photo_id}")
async def delete_photo(photo_id: int, _=Depends(verify_token)):
    conn = get_connection()
    row = conn.execute("SELECT id FROM progress_photos WHERE id=?", (photo_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Photo not found")
    conn.execute("DELETE FROM progress_photos WHERE id=?", (photo_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}
