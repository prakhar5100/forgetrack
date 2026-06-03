from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class UnitEnum(str, Enum):
    kg = "kg"
    lb = "lb"
    BW = "BW"


class FormRatingEnum(str, Enum):
    great = "great"
    good = "good"
    okay = "okay"
    poor = "poor"


class EnergyLevelEnum(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    username: str
    password: str


# Muscle Groups
class MuscleGroupCreate(BaseModel):
    name: str
    color_hex: str
    icon: Optional[str] = None


class MuscleGroupOut(BaseModel):
    id: int
    name: str
    color_hex: str
    icon: Optional[str] = None


# Exercises
class ExerciseOut(BaseModel):
    id: int
    name: str
    muscle_group_id: int
    equipment: Optional[str] = None
    primary_muscles: Optional[str] = None
    cues: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    reference_link: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None
    muscle_group: Optional[MuscleGroupOut] = None


# Workout Logs
class WorkoutLogCreate(BaseModel):
    date: date
    muscle_group_id: int
    exercise_id: int
    sets: int
    reps: int
    weight_kg: float = 0
    unit: UnitEnum = UnitEnum.kg
    form_rating: Optional[FormRatingEnum] = None
    energy_level: Optional[EnergyLevelEnum] = None
    notes: Optional[str] = None


class WorkoutLogOut(BaseModel):
    id: int
    date: str
    week_number: int
    muscle_group_id: int
    exercise_id: int
    sets: int
    reps: int
    weight_kg: float
    unit: str
    form_rating: Optional[str] = None
    energy_level: Optional[str] = None
    notes: Optional[str] = None
    total_volume_kg: float
    created_at: Optional[str] = None
    muscle_group: Optional[MuscleGroupOut] = None
    exercise: Optional[ExerciseOut] = None


class PaginatedLogs(BaseModel):
    items: List[WorkoutLogOut]
    total: int
    page: int
    limit: int
    pages: int


# Progress
class WeightProgress(BaseModel):
    week: int
    year: int
    max_weight: float
    date: Optional[str] = None


class VolumeProgress(BaseModel):
    week: int
    year: int
    total_volume: float


class FormBreakdown(BaseModel):
    week: int
    year: int
    great: int = 0
    good: int = 0
    okay: int = 0
    poor: int = 0


class DashboardSummary(BaseModel):
    total_volume_week: float
    sessions_week: int
    streak: int
    total_sessions_all_time: int
    muscle_group_last_trained: List[dict]


# Progress Photos
class ProgressPhotoOut(BaseModel):
    id: int
    date: str
    image_url: str
    weight_kg: Optional[float] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
