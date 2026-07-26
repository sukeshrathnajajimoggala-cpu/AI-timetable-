from models import Professor, Room, Course, Timeslot, ScheduleSession

def get_default_professors():
    return [
        Professor(id="prof_smith", name="Dr. Alan Smith", dept="Computer Science"),
        Professor(id="prof_jones", name="Dr. Sarah Jones", dept="Computer Science"),
        Professor(id="prof_davis", name="Dr. Robert Davis", dept="Electrical Eng"),
        Professor(id="prof_taylor", name="Dr. Emily Taylor", dept="Mathematics"),
    ]

def get_default_rooms():
    return [
        Room(id="room_101", name="Lecture Hall 101", capacity=60, is_lab=False),
        Room(id="room_102", name="Classroom 102", capacity=30, is_lab=False),
        Room(id="lab_201", name="CS Lab 201", capacity=40, is_lab=True),
        Room(id="room_103", name="Seminar Room 103", capacity=20, is_lab=False),
    ]

def get_default_courses():
    return [
        Course(id="CS101", name="Intro to Computer Science", professor_id="prof_smith", enrollment=50, sessions_per_week=3, requires_lab=False),
        Course(id="CS102", name="Data Structures & Algorithms", professor_id="prof_smith", enrollment=35, sessions_per_week=3, requires_lab=True),
        Course(id="CS201", name="Web Development Lab", professor_id="prof_jones", enrollment=25, sessions_per_week=2, requires_lab=True),
        Course(id="EE101", name="Introduction to Circuits", professor_id="prof_davis", enrollment=45, sessions_per_week=3, requires_lab=False),
        Course(id="MA101", name="Engineering Calculus I", professor_id="prof_taylor", enrollment=55, sessions_per_week=3, requires_lab=False),
    ]

def get_default_timeslots():
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    timeslots = []
    for day in days:
        for period in range(1, 6): # 5 periods a day
            day_short = day[:3].lower()
            timeslots.append(
                Timeslot(
                    id=f"{day_short}_{period}",
                    day=day,
                    period=period
                )
            )
    return timeslots

def get_default_schedule():
    # We manually create a schedule that HAS conflicts:
    # 1. Professor clash: prof_smith teaching CS101 and CS102 on Monday Period 1 (mon_1)
    # 2. Room clash: CS101 and EE101 both scheduled in room_101 on Tuesday Period 2 (tue_2)
    # 3. Capacity overflow: MA101 (enrollment 55) scheduled in room_103 (capacity 20)
    # 4. Room type mismatch: CS102 (requires lab) scheduled in room_102 (not a lab)
    return [
        # CS101 (3 sessions)
        ScheduleSession(session_id="CS101_1", course_id="CS101", room_id="room_101", timeslot_id="mon_1"), # prof_smith, mon_1, room_101
        ScheduleSession(session_id="CS101_2", course_id="CS101", room_id="room_101", timeslot_id="tue_2"), # prof_smith, tue_2, room_101 (Room Clash with EE101_1)
        ScheduleSession(session_id="CS101_3", course_id="CS101", room_id="room_101", timeslot_id="wed_3"),

        # CS102 (3 sessions)
        ScheduleSession(session_id="CS102_1", course_id="CS102", room_id="room_102", timeslot_id="mon_1"), # prof_smith, mon_1, room_102 (Prof Clash with CS101_1, also Room Type Mismatch)
        ScheduleSession(session_id="CS102_2", course_id="CS102", room_id="lab_201", timeslot_id="wed_2"),
        ScheduleSession(session_id="CS102_3", course_id="CS102", room_id="lab_201", timeslot_id="fri_2"),

        # CS201 (2 sessions)
        ScheduleSession(session_id="CS201_1", course_id="CS201", room_id="lab_201", timeslot_id="tue_4"),
        ScheduleSession(session_id="CS201_2", course_id="CS201", room_id="lab_201", timeslot_id="thu_4"),

        # EE101 (3 sessions)
        ScheduleSession(session_id="EE101_1", course_id="EE101", room_id="room_101", timeslot_id="tue_2"), # prof_davis, tue_2, room_101 (Room Clash with CS101_2)
        ScheduleSession(session_id="EE101_2", course_id="EE101", room_id="room_102", timeslot_id="thu_2"),
        ScheduleSession(session_id="EE101_3", course_id="EE101", room_id="room_102", timeslot_id="fri_3"),

        # MA101 (3 sessions)
        ScheduleSession(session_id="MA101_1", course_id="MA101", room_id="room_103", timeslot_id="mon_3"), # Capacity overflow (MA101 enrollment=55, room_103 capacity=20)
        ScheduleSession(session_id="MA101_2", course_id="MA101", room_id="room_101", timeslot_id="wed_1"),
        ScheduleSession(session_id="MA101_3", course_id="MA101", room_id="room_101", timeslot_id="thu_1"),
    ]
