from pydantic import BaseModel
from typing import List, Optional

class Professor(BaseModel):
    id: str
    name: str
    dept: str

class Room(BaseModel):
    id: str
    name: str
    capacity: int
    is_lab: bool = False

class Course(BaseModel):
    id: str
    name: str
    professor_id: str
    enrollment: int
    sessions_per_week: int
    requires_lab: bool = False

class Timeslot(BaseModel):
    id: str        # e.g., "mon_1", "tue_4"
    day: str       # e.g., "Monday"
    period: int    # e.g., 1, 2, 3, 4, 5

class ScheduleSession(BaseModel):
    session_id: str  # e.g., "CS101_1"
    course_id: str
    room_id: str
    timeslot_id: str

class Conflict(BaseModel):
    type: str        # "professor_clash", "room_clash", "capacity_overflow", "room_type_mismatch"
    description: str
    session_ids: List[str]
    severity: str    # "hard" or "soft"

class SolveRequest(BaseModel):
    population_size: int = 100
    generations: int = 150
    mutation_rate: float = 0.15

class TimetableData(BaseModel):
    courses: List[Course]
    professors: List[Professor]
    rooms: List[Room]
    timeslots: List[Timeslot]
    schedule: List[ScheduleSession]
    conflicts: List[Conflict]
