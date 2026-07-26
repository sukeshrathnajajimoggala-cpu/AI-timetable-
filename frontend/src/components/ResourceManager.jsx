import React, { useState } from 'react';
import { Plus, Trash2, MapPin, User, BookOpen, Layers, Check, X, Laptop } from 'lucide-react';
import { addProfessor, deleteProfessor, addRoom, deleteRoom, addCourse, deleteCourse } from '../utils/api';

export default function ResourceManager({ data, onUpdateData, refreshData }) {
  const [activeSubTab, setActiveSubTab] = useState('courses'); // 'courses', 'professors', 'rooms'
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');

  // Professor Form State
  const [profId, setProfId] = useState('');
  const [profName, setProfName] = useState('');
  const [profDept, setProfDept] = useState('');

  // Room Form State
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomIsLab, setRoomIsLab] = useState(false);

  // Course Form State
  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseProfId, setCourseProfId] = useState(data.professors[0]?.id || '');
  const [courseEnrollment, setCourseEnrollment] = useState(30);
  const [courseSessions, setCourseSessions] = useState(3);
  const [courseRequiresLab, setCourseRequiresLab] = useState(false);

  const resetFormStates = () => {
    setProfId(''); setProfName(''); setProfDept('');
    setRoomId(''); setRoomName(''); setRoomCapacity(30); setRoomIsLab(false);
    setCourseId(''); setCourseName(''); setCourseEnrollment(30); setCourseSessions(3); setCourseRequiresLab(false);
    if (data.professors.length > 0) setCourseProfId(data.professors[0].id);
    setFormError('');
  };

  const handleOpenModal = () => {
    resetFormStates();
    setShowModal(true);
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (activeSubTab === 'professors') {
        if (!profId || !profName || !profDept) throw new Error("All fields are required.");
        await addProfessor({ id: profId, name: profName, dept: profDept });
      } 
      else if (activeSubTab === 'rooms') {
        if (!roomId || !roomName) throw new Error("All fields are required.");
        await addRoom({ id: roomId, name: roomName, capacity: parseInt(roomCapacity), is_lab: roomIsLab });
      } 
      else if (activeSubTab === 'courses') {
        if (!courseId || !courseName || !courseProfId) throw new Error("All fields are required.");
        await addCourse({ 
          id: courseId, 
          name: courseName, 
          professor_id: courseProfId, 
          enrollment: parseInt(courseEnrollment), 
          sessions_per_week: parseInt(courseSessions), 
          requires_lab: courseRequiresLab 
        });
      }
      
      setShowModal(false);
      refreshData();
    } catch (err) {
      setFormError(err.message || 'Failed to create resource');
    }
  };

  const handleDeleteResource = async (id) => {
    const confirm = window.confirm(`Are you sure you want to delete this ${activeSubTab.slice(0, -1)}? All related schedule mappings will be affected.`);
    if (!confirm) return;

    try {
      if (activeSubTab === 'professors') {
        await deleteProfessor(id);
      } else if (activeSubTab === 'rooms') {
        await deleteRoom(id);
      } else if (activeSubTab === 'courses') {
        await deleteCourse(id);
      }
      refreshData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>Resource Directory</span>
        <button className="btn btn-accent" onClick={handleOpenModal}>
          <Plus size={16} />
          Add {activeSubTab === 'courses' ? 'Course' : activeSubTab === 'professors' ? 'Professor' : 'Room'}
        </button>
      </div>

      {/* Sub tabs navigation */}
      <div className="tabs-container" style={{ margin: '0 0 20px 0' }}>
        <button 
          className={`tab-btn ${activeSubTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('courses')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} /> Courses ({data.courses.length})
          </span>
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'professors' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('professors')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} /> Professors ({data.professors.length})
          </span>
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('rooms')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} /> Rooms ({data.rooms.length})
          </span>
        </button>
      </div>

      {/* Tables container */}
      <div className="table-container">
        {activeSubTab === 'courses' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Title</th>
                <th>Professor</th>
                <th>Class Size</th>
                <th>Sessions/Wk</th>
                <th>Requirements</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.map(course => {
                const prof = data.professors.find(p => p.id === course.professor_id);
                return (
                  <tr key={course.id}>
                    <td><span className="badge-mono">{course.id}</span></td>
                    <td><strong>{course.name}</strong></td>
                    <td>{prof ? prof.name : 'Unknown Professor'}</td>
                    <td>{course.enrollment}</td>
                    <td>{course.sessions_per_week} classes</td>
                    <td>
                      {course.requires_lab ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          <Laptop size={10} /> Lab Required
                        </span>
                      ) : 'Lecture Room'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        style={{ border: 'none', color: 'var(--destructive)', backgroundColor: 'transparent' }}
                        onClick={() => handleDeleteResource(course.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeSubTab === 'professors' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Professor Name</th>
                <th>Department</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.professors.map(prof => (
                <tr key={prof.id}>
                  <td><span className="badge-mono">{prof.id}</span></td>
                  <td><strong>{prof.name}</strong></td>
                  <td>{prof.dept}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon" 
                      style={{ border: 'none', color: 'var(--destructive)', backgroundColor: 'transparent' }}
                      onClick={() => handleDeleteResource(prof.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeSubTab === 'rooms' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Room ID</th>
                <th>Name / Room Number</th>
                <th>Capacity</th>
                <th>Room Type</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rooms.map(room => (
                <tr key={room.id}>
                  <td><span className="badge-mono">{room.id}</span></td>
                  <td><strong>{room.name}</strong></td>
                  <td>{room.capacity} seats</td>
                  <td>
                    {room.is_lab ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        <Laptop size={10} /> Computer Lab
                      </span>
                    ) : 'Lecture Room'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon" 
                      style={{ border: 'none', color: 'var(--destructive)', backgroundColor: 'transparent' }}
                      onClick={() => handleDeleteResource(room.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Creation Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Add {activeSubTab === 'courses' ? 'Course' : activeSubTab === 'professors' ? 'Professor' : 'Room'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateResource}>
              {/* PROFESSORS FORM */}
              {activeSubTab === 'professors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Professor ID (Unique)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g., prof_miller" 
                      value={profId} 
                      onChange={(e) => setProfId(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g., Dr. Harry Miller" 
                      value={profName} 
                      onChange={(e) => setProfName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g., Computer Science" 
                      value={profDept} 
                      onChange={(e) => setProfDept(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ROOMS FORM */}
              {activeSubTab === 'rooms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Room ID (Unique)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g., room_302" 
                      value={roomId} 
                      onChange={(e) => setRoomId(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g., Chemistry Lab 302" 
                      value={roomName} 
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Seating Capacity</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={roomCapacity} 
                      onChange={(e) => setRoomCapacity(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group form-checkbox">
                    <input 
                      type="checkbox" 
                      id="roomIsLab"
                      checked={roomIsLab} 
                      onChange={(e) => setRoomIsLab(e.target.checked)}
                    />
                    <label htmlFor="roomIsLab" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                      Is a Computer / Hardware Lab
                    </label>
                  </div>
                </div>
              )}

              {/* COURSES FORM */}
              {activeSubTab === 'courses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Course Code (Unique)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g., CS301" 
                        value={courseId} 
                        onChange={(e) => setCourseId(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Course Title</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g., Software Engineering" 
                        value={courseName} 
                        onChange={(e) => setCourseName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Instructor</label>
                    <select 
                      className="form-input form-select"
                      value={courseProfId}
                      onChange={(e) => setCourseProfId(e.target.value)}
                    >
                      {data.professors.map(prof => (
                        <option key={prof.id} value={prof.id}>{prof.name} ({prof.dept})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Enrollment Count</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={courseEnrollment} 
                        onChange={(e) => setCourseEnrollment(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Classes Per Week</label>
                      <select 
                        className="form-input form-select"
                        value={courseSessions}
                        onChange={(e) => setCourseSessions(parseInt(e.target.value))}
                      >
                        <option value="1">1 session</option>
                        <option value="2">2 sessions</option>
                        <option value="3">3 sessions</option>
                        <option value="4">4 sessions</option>
                        <option value="5">5 sessions</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group form-checkbox">
                    <input 
                      type="checkbox" 
                      id="courseRequiresLab"
                      checked={courseRequiresLab} 
                      onChange={(e) => setCourseRequiresLab(e.target.checked)}
                    />
                    <label htmlFor="courseRequiresLab" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                      Requires Computer Lab (e.g. programming classes)
                    </label>
                  </div>
                </div>
              )}

              {formError && (
                <p style={{ color: 'var(--destructive)', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '12px' }}>{formError}</p>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">
                  <Check size={14} /> Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
