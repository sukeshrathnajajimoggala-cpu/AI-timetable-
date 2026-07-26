from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import copy
import os

from models import Professor, Room, Course, Timeslot, ScheduleSession, Conflict, SolveRequest, TimetableData
import sample_data
from genetic_solver import evaluate_schedule, GeneticSolver

API_KEY = os.getenv("API_KEY")

app = FastAPI(title="AI Timetable Conflict Resolver API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store
db = {
    "courses": [],
    "professors": [],
    "rooms": [],
    "timeslots": [],
    "schedule": []
}

def reset_db():
    db["courses"] = sample_data.get_default_courses()
    db["professors"] = sample_data.get_default_professors()
    db["rooms"] = sample_data.get_default_rooms()
    db["timeslots"] = sample_data.get_default_timeslots()
    db["schedule"] = sample_data.get_default_schedule()

# Initialize database
reset_db()

@app.get("/api/data", response_model=TimetableData)
def get_data():
    fitness, conflicts, hard_count, soft_count = evaluate_schedule(
        db["schedule"], db["courses"], db["professors"], db["rooms"], db["timeslots"]
    )
    return TimetableData(
        courses=db["courses"],
        professors=db["professors"],
        rooms=db["rooms"],
        timeslots=db["timeslots"],
        schedule=db["schedule"],
        conflicts=conflicts
    )

@app.post("/api/reset", response_model=TimetableData)
def reset_data():
    reset_db()
    return get_data()

@app.get("/api/config")
def get_config():
    return {
        "api_key_configured": bool(API_KEY),
        "api_key_present": bool(API_KEY)
    }

@app.post("/api/solve")
def solve_timetable(req: SolveRequest):
    try:
        solver = GeneticSolver(
            courses=db["courses"],
            professors=db["professors"],
            rooms=db["rooms"],
            timeslots=db["timeslots"],
            pop_size=req.population_size,
            mutation_rate=req.mutation_rate
        )
        
        # Run Genetic Algorithm solver
        solved_schedule, history = solver.solve(generations=req.generations)
        
        # Update current database schedule
        db["schedule"] = solved_schedule
        
        # Evaluate final conflicts
        fitness, conflicts, hard_count, soft_count = evaluate_schedule(
            db["schedule"], db["courses"], db["professors"], db["rooms"], db["timeslots"]
        )
        
        return {
            "schedule": db["schedule"],
            "history": history,
            "conflicts": conflicts,
            "fitness": fitness,
            "hard_conflicts": hard_count,
            "soft_conflicts": soft_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Resource Management CRUD ---

# Professors
@app.post("/api/professors", response_model=Professor)
def add_professor(prof: Professor):
    # Check if ID already exists
    if any(p.id == prof.id for p in db["professors"]):
        raise HTTPException(status_code=400, detail="Professor with this ID already exists.")
    db["professors"].append(prof)
    return prof

@app.delete("/api/professors/{prof_id}")
def delete_professor(prof_id: str):
    db["professors"] = [p for p in db["professors"] if p.id != prof_id]
    # Remove courses and schedules related to this professor
    db["courses"] = [c for c in db["courses"] if c.professor_id != prof_id]
    db["schedule"] = [s for s in db["schedule"] if s.course_id in [c.id for c in db["courses"]]]
    return {"status": "success", "message": f"Professor {prof_id} deleted."}

# Rooms
@app.post("/api/rooms", response_model=Room)
def add_room(room: Room):
    if any(r.id == room.id for r in db["rooms"]):
        raise HTTPException(status_code=400, detail="Room with this ID already exists.")
    db["rooms"].append(room)
    return room

@app.delete("/api/rooms/{room_id}")
def delete_room(room_id: str):
    db["rooms"] = [r for r in db["rooms"] if r.id != room_id]
    # Remove sessions scheduled in this room (or they will trigger conflicts; better to remove allocations)
    # Set room to empty or random
    for session in db["schedule"]:
        if session.room_id == room_id:
            # Reassign to a default or leave empty
            if db["rooms"]:
                session.room_id = db["rooms"][0].id
    return {"status": "success", "message": f"Room {room_id} deleted."}

# Courses
@app.post("/api/courses", response_model=Course)
def add_course(course: Course):
    if any(c.id == course.id for c in db["courses"]):
        raise HTTPException(status_code=400, detail="Course with this ID already exists.")
    if not any(p.id == course.professor_id for p in db["professors"]):
        raise HTTPException(status_code=400, detail="Professor ID does not exist.")
        
    db["courses"].append(course)
    
    # Automatically add new sessions to schedule
    for s_idx in range(1, course.sessions_per_week + 1):
        # Place in a random room and timeslot initially
        default_room = db["rooms"][0].id if db["rooms"] else "room_101"
        default_slot = db["timeslots"][0].id if db["timeslots"] else "mon_1"
        db["schedule"].append(ScheduleSession(
            session_id=f"{course.id}_{s_idx}",
            course_id=course.id,
            room_id=default_room,
            timeslot_id=default_slot
        ))
    return course

@app.delete("/api/courses/{course_id}")
def delete_course(course_id: str):
    db["courses"] = [c for c in db["courses"] if c.id != course_id]
    db["schedule"] = [s for s in db["schedule"] if s.course_id != course_id]
    return {"status": "success", "message": f"Course {course_id} deleted."}

# Schedule Manual Edit
@app.post("/api/schedule/update")
def update_schedule_session(session: ScheduleSession):
    for s in db["schedule"]:
        if s.session_id == session.session_id:
            s.room_id = session.room_id
            s.timeslot_id = session.timeslot_id
            return {"status": "success", "session": s}
    raise HTTPException(status_code=404, detail=f"Session {session.session_id} not found.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
