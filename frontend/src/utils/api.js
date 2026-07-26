/**
 * API helper functions to interact with the FastAPI backend.
 * By using the Vite proxy, requests to '/api/...' will be forwarded to 'http://127.0.0.1:8000/api/...'.
 */

export async function fetchTimetableData() {
  const response = await fetch('/api/data');
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to fetch timetable data');
  }
  return response.json();
}

export async function runAISolver(params) {
  const response = await fetch('/api/solve', {
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
  return response.json();
}

export async function resetTimetableData() {
  const response = await fetch('/api/reset', {
    method: 'POST',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to reset timetable data');
  }
  return response.json();
}

export async function addProfessor(professor) {
  const response = await fetch('/api/professors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(professor),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to add professor');
  }
  return response.json();
}

export async function deleteProfessor(profId) {
  const response = await fetch(`/api/professors/${profId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to delete professor');
  }
  return response.json();
}

export async function addRoom(room) {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(room),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to add room');
  }
  return response.json();
}

export async function deleteRoom(roomId) {
  const response = await fetch(`/api/rooms/${roomId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to delete room');
  }
  return response.json();
}

export async function addCourse(course) {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(course),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to add course');
  }
  return response.json();
}

export async function deleteCourse(courseId) {
  const response = await fetch(`/api/courses/${courseId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to delete course');
  }
  return response.json();
}

export async function updateScheduleSession(session) {
  const response = await fetch('/api/schedule/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(session),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to update schedule session');
  }
  return response.json();
}
