import React, { useState } from 'react';
import { AlertTriangle, MapPin, User, Calendar, X, Edit, Check } from 'lucide-react';
import { updateScheduleSession } from '../utils/api';

export default function TimetableGrid({ data, onUpdateData }) {
  const [filterType, setFilterType] = useState('room'); // 'room' or 'professor'
  const [selectedRoomId, setSelectedRoomId] = useState(data.rooms[0]?.id || '');
  const [selectedProfId, setSelectedProfId] = useState(data.professors[0]?.id || '');
  const [selectedSession, setSelectedSession] = useState(null); // Session clicked for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editRoomId, setEditRoomId] = useState('');
  const [editSlotId, setEditSlotId] = useState('');
  const [saveError, setSaveError] = useState('');

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5];

  // Map resources for fast lookup
  const courseMap = {};
  data.courses.forEach(c => { courseMap[c.id] = c; });

  const roomMap = {};
  data.rooms.forEach(r => { roomMap[r.id] = r; });

  const profMap = {};
  data.professors.forEach(p => { profMap[p.id] = p; });

  const slotMap = {};
  data.timeslots.forEach(t => { slotMap[t.id] = t; });

  // Get matching sessions for a specific day and period based on filters
  const getSessionsForSlot = (day, period) => {
    // Find timeslot id for this day and period
    const dayShort = day.substring(0, 3).toLowerCase();
    const slotId = `${dayShort}_${period}`;

    return data.schedule.filter(session => {
      if (session.timeslot_id !== slotId) return false;

      if (filterType === 'room') {
        return session.room_id === selectedRoomId;
      } else {
        const course = courseMap[session.course_id];
        return course && course.professor_id === selectedProfId;
      }
    });
  };

  // Check if a session has conflicts
  const getSessionConflict = (sessionId) => {
    return data.conflicts.find(c => c.session_ids.includes(sessionId));
  };

  const handleCardClick = (session) => {
    setSelectedSession(session);
    setEditRoomId(session.room_id);
    setEditSlotId(session.timeslot_id);
    setIsEditing(false);
    setSaveError('');
  };

  const handleManualReassign = async () => {
    try {
      setSaveError('');
      const response = await updateScheduleSession({
        session_id: selectedSession.session_id,
        course_id: selectedSession.course_id,
        room_id: editRoomId,
        timeslot_id: editSlotId
      });

      // Update local schedule state
      const updatedSchedule = data.schedule.map(s => {
        if (s.session_id === selectedSession.session_id) {
          return { ...s, room_id: editRoomId, timeslot_id: editSlotId };
        }
        return s;
      });

      // We re-evaluate conflicts after a manual reassignment on the client side
      // However, to keep it sync, we can request fresh data from backend
      // But let's just trigger a data refresh from App.jsx!
      
      setSelectedSession(null);
      setIsEditing(false);
      
      // Let's trigger a full data refetch in the parent component to calculate conflicts
      if (onUpdateData) {
        // Fetch fresh data from backend
        const freshDataResponse = await fetch('/api/data');
        const freshData = await freshDataResponse.json();
        onUpdateData(freshData);
      }
      
    } catch (err) {
      setSaveError(err.message || 'Failed to update schedule');
    }
  };

  return (
    <div>
      {/* Filters and Controls */}
      <div className="timetable-controls">
        <div className="view-selector">
          <button 
            className={`view-btn ${filterType === 'room' ? 'active' : ''}`}
            onClick={() => setFilterType('room')}
          >
            Filter by Room
          </button>
          <button 
            className={`view-btn ${filterType === 'professor' ? 'active' : ''}`}
            onClick={() => setFilterType('professor')}
          >
            Filter by Professor
          </button>
        </div>

        <div>
          {filterType === 'room' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="form-label" style={{ margin: 0 }}>Select Room:</span>
              <select 
                className="form-input form-select" 
                style={{ width: '200px', padding: '6px 12px' }}
                value={selectedRoomId} 
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                {data.rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name} ({room.capacity} seats)</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="form-label" style={{ margin: 0 }}>Select Professor:</span>
              <select 
                className="form-input form-select" 
                style={{ width: '200px', padding: '6px 12px' }}
                value={selectedProfId} 
                onChange={(e) => setSelectedProfId(e.target.value)}
              >
                {data.professors.map(prof => (
                  <option key={prof.id} value={prof.id}>{prof.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Grid Table */}
      <div className="timetable-scroll-container">
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Time Slot</th>
              {days.map(day => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period}>
                <td>
                  <strong>Period {period}</strong>
                  <span className="period-header">
                    {period === 1 ? '09:00 - 10:00' : 
                     period === 2 ? '10:15 - 11:15' : 
                     period === 3 ? '11:30 - 12:30' : 
                     period === 4 ? '13:30 - 14:30' : '14:45 - 15:45'}
                  </span>
                </td>
                {days.map(day => {
                  const sessions = getSessionsForSlot(day, period);
                  return (
                    <td key={day}>
                      <div className="cell-slot">
                        {sessions.length === 0 ? (
                          <span className="empty-cell">Empty</span>
                        ) : (
                          sessions.map(session => {
                            const course = courseMap[session.course_id];
                            const conflict = getSessionConflict(session.session_id);
                            return (
                              <div 
                                key={session.session_id} 
                                className={`scheduled-session-card ${conflict ? 'has-conflict' : ''}`}
                                onClick={() => handleCardClick(session)}
                              >
                                {conflict && (
                                  <div className="conflict-warning-badge" title={conflict.description}>
                                    <AlertTriangle size={14} />
                                  </div>
                                )}
                                <div>
                                  <div className="session-course-id">{session.course_id}</div>
                                  <div className="session-course-name">{course ? course.name : 'Unknown Course'}</div>
                                </div>
                                <div className="session-details">
                                  {filterType === 'room' ? (
                                    <div className="session-detail-item">
                                      <User size={10} />
                                      <span>{course && profMap[course.professor_id] ? profMap[course.professor_id].name : 'Unknown'}</span>
                                    </div>
                                  ) : (
                                    <div className="session-detail-item">
                                      <MapPin size={10} />
                                      <span>{roomMap[session.room_id]?.name || 'Unknown Room'}</span>
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 'bold' }}>
                                    Session #{session.session_id.split('_')[1]}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details / Edit Modal */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Session Details</h3>
              <button className="modal-close" onClick={() => setSelectedSession(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span className="form-label" style={{ marginBottom: '2px' }}>Course</span>
                <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  {selectedSession.course_id} - {courseMap[selectedSession.course_id]?.name}
                </p>
                <p className="card-title-sub">
                  Enrollment: {courseMap[selectedSession.course_id]?.enrollment} students
                  {courseMap[selectedSession.course_id]?.requires_lab && ' | Requires Computer Lab'}
                </p>
              </div>

              <div>
                <span className="form-label" style={{ marginBottom: '2px' }}>Professor</span>
                <p style={{ fontWeight: 600 }}>
                  {courseMap[selectedSession.course_id] && profMap[courseMap[selectedSession.course_id].professor_id]?.name}
                </p>
                <p className="card-title-sub">
                  Department: {courseMap[selectedSession.course_id] && profMap[courseMap[selectedSession.course_id].professor_id]?.dept}
                </p>
              </div>

              {/* Conflict Status */}
              {getSessionConflict(selectedSession.session_id) && (
                <div style={{
                  padding: '12px',
                  backgroundColor: getSessionConflict(selectedSession.session_id).severity === 'hard' ? 'var(--destructive-light)' : 'var(--warning-light)',
                  border: `1px solid ${getSessionConflict(selectedSession.session_id).severity === 'hard' ? 'var(--destructive)' : 'var(--warning)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle 
                    size={16} 
                    style={{ 
                      color: getSessionConflict(selectedSession.session_id).severity === 'hard' ? 'var(--destructive)' : 'var(--warning)',
                      marginTop: '2px',
                      flexShrink: 0
                    }} 
                  />
                  <div>
                    <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: getSessionConflict(selectedSession.session_id).severity === 'hard' ? 'var(--destructive)' : 'var(--warning)' }}>
                      {getSessionConflict(selectedSession.session_id).severity} Conflict Detected
                    </strong>
                    <p style={{ fontSize: '0.825rem', marginTop: '2px' }}>{getSessionConflict(selectedSession.session_id).description}</p>
                  </div>
                </div>
              )}

              {/* Manual Scheduler Form */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="form-label" style={{ margin: 0 }}>Allocation Settings</span>
                  {!isEditing && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit size={12} />
                      Manual Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Room</label>
                        <select 
                          className="form-input form-select"
                          value={editRoomId}
                          onChange={(e) => setEditRoomId(e.target.value)}
                        >
                          {data.rooms.map(room => (
                            <option key={room.id} value={room.id}>
                              {room.name} (Cap: {room.capacity} {room.is_lab && '💻'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Timeslot</label>
                        <select 
                          className="form-input form-select"
                          value={editSlotId}
                          onChange={(e) => setEditSlotId(e.target.value)}
                        >
                          {data.timeslots.map(slot => (
                            <option key={slot.id} value={slot.id}>
                              {slot.day} - Period {slot.period}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {saveError && (
                      <p style={{ color: 'var(--destructive)', fontSize: '0.8rem', fontWeight: 'bold' }}>{saveError}</p>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setEditRoomId(selectedSession.room_id);
                          setEditSlotId(selectedSession.timeslot_id);
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={handleManualReassign}
                      >
                        <Check size={14} />
                        Apply Allocation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-row" style={{ backgroundColor: 'var(--bg-page)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assigned Room</span>
                      <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {roomMap[selectedSession.room_id]?.name || selectedSession.room_id}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assigned Time</span>
                      <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {slotMap[selectedSession.timeslot_id] ? `${slotMap[selectedSession.timeslot_id].day} P${slotMap[selectedSession.timeslot_id].period}` : selectedSession.timeslot_id}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedSession(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
