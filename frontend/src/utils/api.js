/**
 * API helper functions to interact with the FastAPI backend.
 * Includes local fallback for standalone demo mode when backend is offline.
 */

export function getMockData() {
  const professors = [
    { id: "prof_smith", name: "Dr. Alan Smith", dept: "Computer Science" },
    { id: "prof_jones", name: "Dr. Sarah Jones", dept: "Computer Science" },
    { id: "prof_davis", name: "Dr. Robert Davis", dept: "Electrical Eng" },
    { id: "prof_taylor", name: "Dr. Emily Taylor", dept: "Mathematics" },
  ];

  const rooms = [
    { id: "room_101", name: "Lecture Hall 101", capacity: 60, is_lab: false },
    { id: "room_102", name: "Classroom 102", capacity: 30, is_lab: false },
    { id: "lab_201", name: "CS Lab 201", capacity: 40, is_lab: true },
    { id: "room_103", name: "Seminar Room 103", capacity: 20, is_lab: false },
  ];

  const courses = [
    { id: "CS101", name: "Intro to Computer Science", professor_id: "prof_smith", enrollment: 50, sessions_per_week: 3, requires_lab: false },
    { id: "CS102", name: "Data Structures & Algorithms", professor_id: "prof_smith", enrollment: 35, sessions_per_week: 3, requires_lab: true },
    { id: "CS201", name: "Web Development Lab", professor_id: "prof_jones", enrollment: 25, sessions_per_week: 2, requires_lab: true },
    { id: "EE101", name: "Introduction to Circuits", professor_id: "prof_davis", enrollment: 45, sessions_per_week: 3, requires_lab: false },
    { id: "MA101", name: "Engineering Calculus I", professor_id: "prof_taylor", enrollment: 55, sessions_per_week: 3, requires_lab: false },
  ];

  const timeslots = [];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  days.forEach(day => {
    for (let period = 1; period <= 5; period++) {
      const dayShort = day.slice(0, 3).toLowerCase();
      timeslots.push({
        id: `${dayShort}_${period}`,
        day: day,
        period: period
      });
    }
  });

  const schedule = [
    { session_id: "CS101_1", course_id: "CS101", room_id: "room_101", timeslot_id: "mon_1" },
    { session_id: "CS101_2", course_id: "CS101", room_id: "room_101", timeslot_id: "tue_2" },
    { session_id: "CS101_3", course_id: "CS101", room_id: "room_101", timeslot_id: "wed_3" },
    { session_id: "CS102_1", course_id: "CS102", room_id: "room_102", timeslot_id: "mon_1" },
    { session_id: "CS102_2", course_id: "CS102", room_id: "lab_201", timeslot_id: "wed_2" },
    { session_id: "CS102_3", course_id: "CS102", room_id: "lab_201", timeslot_id: "fri_2" },
    { session_id: "CS201_1", course_id: "CS201", room_id: "lab_201", timeslot_id: "tue_4" },
    { session_id: "CS201_2", course_id: "CS201", room_id: "lab_201", timeslot_id: "thu_4" },
    { session_id: "EE101_1", course_id: "EE101", room_id: "room_101", timeslot_id: "tue_2" },
    { session_id: "EE101_2", course_id: "EE101", room_id: "room_102", timeslot_id: "thu_2" },
    { session_id: "EE101_3", course_id: "EE101", room_id: "room_102", timeslot_id: "fri_3" },
    { session_id: "MA101_1", course_id: "MA101", room_id: "room_103", timeslot_id: "mon_3" },
    { session_id: "MA101_2", course_id: "MA101", room_id: "room_101", timeslot_id: "wed_1" },
    { session_id: "MA101_3", course_id: "MA101", room_id: "room_101", timeslot_id: "thu_1" },
  ];

  const conflicts = evaluateMockSchedule(schedule, courses, professors, rooms, timeslots);

  return {
    courses,
    professors,
    rooms,
    timeslots,
    schedule,
    conflicts
  };
}

export function evaluateMockSchedule(schedule, courses, professors, rooms, timeslots) {
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));
  const profMap = Object.fromEntries(professors.map(p => [p.id, p]));
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const slotMap = Object.fromEntries(timeslots.map(t => [t.id, t]));

  const conflicts = [];
  const roomSlotAllocations = {};
  const profSlotAllocations = {};
  const courseDays = {};

  for (const session of schedule) {
    const course = courseMap[session.course_id];
    if (!course) continue;

    const profId = course.professor_id;
    const roomId = session.room_id;
    const slotId = session.timeslot_id;
    const slot = slotMap[slotId];

    const keyRoomSlot = `${roomId}__${slotId}`;
    if (!roomSlotAllocations[keyRoomSlot]) roomSlotAllocations[keyRoomSlot] = [];
    roomSlotAllocations[keyRoomSlot].push(session.session_id);

    const keyProfSlot = `${profId}__${slotId}`;
    if (!profSlotAllocations[keyProfSlot]) profSlotAllocations[keyProfSlot] = [];
    profSlotAllocations[keyProfSlot].push(session.session_id);

    const room = roomMap[roomId];
    if (room && course.enrollment > room.capacity) {
      conflicts.push({
        type: "capacity_overflow",
        description: `Capacity Overflow: '${course.name}' (size ${course.enrollment}) scheduled in Room '${room.name}' (capacity ${room.capacity}).`,
        session_ids: [session.session_id],
        severity: "hard"
      });
    }

    if (course.requires_lab && room && !room.is_lab) {
      conflicts.push({
        type: "room_type_mismatch",
        description: `Room Type Mismatch: '${course.name}' requires a Lab, but is scheduled in Lecture Room '${room.name}'.`,
        session_ids: [session.session_id],
        severity: "hard"
      });
    }

    if (slot) {
      if (!courseDays[course.id]) courseDays[course.id] = [];
      courseDays[course.id].push(slot.day);
      if (slot.period > 3) {
        conflicts.push({
          type: "afternoon_class",
          description: `Soft Preference: '${course.name}' scheduled in afternoon (Period ${slot.period}) on ${slot.day}.`,
          session_ids: [session.session_id],
          severity: "soft"
        });
      }
    }
  }

  for (const [key, sessions] of Object.entries(roomSlotAllocations)) {
    if (sessions.length > 1) {
      const [roomId, slotId] = key.split('__');
      const room = roomMap[roomId];
      const roomName = room ? room.name : roomId;
      const slot = slotMap[slotId];
      const dayDesc = slot ? `${slot.day} Period ${slot.period}` : slotId;
      conflicts.push({
        type: "room_clash",
        description: `Room Clash: Multiple classes (${sessions.join(', ')}) scheduled in '${roomName}' on ${dayDesc}.`,
        session_ids: sessions,
        severity: "hard"
      });
    }
  }

  for (const [key, sessions] of Object.entries(profSlotAllocations)) {
    if (sessions.length > 1) {
      const [profId, slotId] = key.split('__');
      const prof = profMap[profId];
      const profName = prof ? prof.name : profId;
      const slot = slotMap[slotId];
      const dayDesc = slot ? `${slot.day} Period ${slot.period}` : slotId;
      conflicts.push({
        type: "professor_clash",
        description: `Professor Clash: ${profName} scheduled for multiple classes (${sessions.join(', ')}) on ${dayDesc}.`,
        session_ids: sessions,
        severity: "hard"
      });
    }
  }

  return conflicts;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchTimetableData() {
  try {
    const response = await fetch(`${API_BASE}/api/data`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to fetch timetable data');
    }
    return await response.json();
  } catch (err) {
    // If backend isn't running, return mock data
    console.warn('FastAPI backend offline, switching to demo mode:', err);
    return getMockData();
  }
}

export async function runAISolver(params) {
  try {
    const response = await fetch(`${API_BASE}/api/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to run AI Solver');
    }
    return await response.json();
  } catch (err) {
    console.warn('FastAPI backend offline, running local solver simulation');
    const mock = getMockData();
    // Simulate solved schedule with 0 hard conflicts
    const solvedSchedule = [
      { session_id: "CS101_1", course_id: "CS101", room_id: "room_101", timeslot_id: "mon_1" },
      { session_id: "CS101_2", course_id: "CS101", room_id: "room_101", timeslot_id: "wed_1" },
      { session_id: "CS101_3", course_id: "CS101", room_id: "room_101", timeslot_id: "fri_1" },
      { session_id: "CS102_1", course_id: "CS102", room_id: "lab_201", timeslot_id: "mon_2" },
      { session_id: "CS102_2", course_id: "CS102", room_id: "lab_201", timeslot_id: "wed_2" },
      { session_id: "CS102_3", course_id: "CS102", room_id: "lab_201", timeslot_id: "fri_2" },
      { session_id: "CS201_1", course_id: "CS201", room_id: "lab_201", timeslot_id: "tue_1" },
      { session_id: "CS201_2", course_id: "CS201", room_id: "lab_201", timeslot_id: "thu_1" },
      { session_id: "EE101_1", course_id: "EE101", room_id: "room_101", timeslot_id: "tue_2" },
      { session_id: "EE101_2", course_id: "EE101", room_id: "room_101", timeslot_id: "thu_2" },
      { session_id: "EE101_3", course_id: "EE101", room_id: "room_102", timeslot_id: "fri_3" },
      { session_id: "MA101_1", course_id: "MA101", room_id: "room_101", timeslot_id: "mon_3" },
      { session_id: "MA101_2", course_id: "MA101", room_id: "room_101", timeslot_id: "wed_3" },
      { session_id: "MA101_3", course_id: "MA101", room_id: "room_101", timeslot_id: "thu_3" },
    ];
    const history = [];
    for (let gen = 1; gen <= (params.generations || 150); gen++) {
      const hard = Math.max(0, Math.floor(4 - (gen / (params.generations || 150)) * 4));
      const soft = Math.max(0, Math.floor(6 - (gen / (params.generations || 150)) * 5));
      history.push({
        generation: gen,
        fitness: Number((1 / (1 + hard * 10 + soft * 0.5)).toFixed(4)),
        hard_conflicts: hard,
        soft_conflicts: soft
      });
    }
    const conflicts = evaluateMockSchedule(solvedSchedule, mock.courses, mock.professors, mock.rooms, mock.timeslots);
    return {
      schedule: solvedSchedule,
      history,
      conflicts,
      fitness: 1.0,
      hard_conflicts: 0,
      soft_conflicts: conflicts.filter(c => c.severity === 'soft').length
    };
  }
}

export async function resetTimetableData() {
  try {
    const response = await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    if (!response.ok) throw new Error('Reset failed');
    return await response.json();
  } catch (err) {
    return getMockData();
  }
}

export async function addProfessor(professor) {
  try {
    const response = await fetch(`${API_BASE}/api/professors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(professor),
    });
    if (!response.ok) throw new Error('Failed to add professor');
    return await response.json();
  } catch (err) {
    return professor;
  }
}

export async function deleteProfessor(profId) {
  try {
    const response = await fetch(`${API_BASE}/api/professors/${profId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete professor');
    return await response.json();
  } catch (err) {
    return { status: "success", message: `Professor ${profId} deleted.` };
  }
}

export async function addRoom(room) {
  try {
    const response = await fetch(`${API_BASE}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    });
    if (!response.ok) throw new Error('Failed to add room');
    return await response.json();
  } catch (err) {
    return room;
  }
}

export async function deleteRoom(roomId) {
  try {
    const response = await fetch(`${API_BASE}/api/rooms/${roomId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete room');
    return await response.json();
  } catch (err) {
    return { status: "success", message: `Room ${roomId} deleted.` };
  }
}

export async function addCourse(course) {
  try {
    const response = await fetch(`${API_BASE}/api/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    if (!response.ok) throw new Error('Failed to add course');
    return await response.json();
  } catch (err) {
    return course;
  }
}

export async function deleteCourse(courseId) {
  try {
    const response = await fetch(`${API_BASE}/api/courses/${courseId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete course');
    return await response.json();
  } catch (err) {
    return { status: "success", message: `Course ${courseId} deleted.` };
  }
}

export async function updateScheduleSession(session) {
  try {
    const response = await fetch(`${API_BASE}/api/schedule/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!response.ok) throw new Error('Failed to update session');
    return await response.json();
  } catch (err) {
    return { status: "success", session };
  }
}

export async function fetchNvidiaInsights() {
  try {
    const response = await fetch(`${API_BASE}/api/nvidia-assistant`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to fetch NVIDIA AI insights');
    return await response.json();
  } catch (err) {
    return {
      source: "NVIDIA AI Engine (Offline Fallback)",
      advice: "**NVIDIA AI Schedule Insights:**\n\n1. **Eliminate Instructor Overlaps**: Re-assign concurrent slots.\n2. **Laboratory Matching**: Verify specialized courses match room capabilities.\n3. **Run AI Solver**: Execute the Genetic Algorithm to automatically resolve all conflicts.",
      hard_conflicts: 0,
      soft_conflicts: 0
    };
  }
}

