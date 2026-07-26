import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Library, ShieldAlert, Cpu } from 'lucide-react';
import { fetchTimetableData } from './utils/api';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './components/Dashboard';
import TimetableGrid from './components/TimetableGrid';
import ResourceManager from './components/ResourceManager';
import ConflictsView from './components/ConflictsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const timetableData = await fetchTimetableData();
      setData(timetableData);
    } catch (err) {
      setError(err.message || 'Failed to load timetable data from API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Loading AI Scheduler Environment...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        padding: '24px',
        textAlign: 'center',
        gap: '16px'
      }}>
        <ShieldAlert size={48} style={{ color: 'var(--destructive)' }} />
        <h2 style={{ fontWeight: 800 }}>Database Connection Failed</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.9rem' }}>
          Unable to establish a connection with the FastAPI backend server. Make sure your Python backend is running on port 8000.
        </p>
        <button className="btn btn-accent" onClick={loadData}>
          Retry Connection
        </button>
      </div>
    );
  }

  const hardConflicts = data?.conflicts.filter(c => c.severity === 'hard').length || 0;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Cpu size={20} />
            </div>
            <span className="sidebar-title">Scheduler AI</span>
          </div>

          <nav>
            <ul className="sidebar-menu">
              <li>
                <button 
                  className={`sidebar-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  className={`sidebar-item-btn ${activeTab === 'timetable' ? 'active' : ''}`}
                  onClick={() => setActiveTab('timetable')}
                >
                  <Calendar size={18} />
                  Timetable Grid
                </button>
              </li>
              <li>
                <button 
                  className={`sidebar-item-btn ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resources')}
                >
                  <Library size={18} />
                  Resource Directory
                </button>
              </li>
              <li>
                <button 
                  className={`sidebar-item-btn ${activeTab === 'conflicts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('conflicts')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <ShieldAlert size={18} />
                      <span>Conflicts Auditor</span>
                    </div>
                    {hardConflicts > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: 'var(--destructive)',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        lineHeight: 1
                      }}>
                        {hardConflicts}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>API Status</span>
            <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'semibold' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }} />
              Connected (FastAPI)
            </span>
          </div>
        </div>
      </aside>

      {/* Main Display Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="main-title">
            {activeTab === 'dashboard' && (
              <>
                <h1>AI Conflict Resolver</h1>
                <p>Monitor system metrics, execute Genetic Algorithm schedules, and review logs.</p>
              </>
            )}
            {activeTab === 'timetable' && (
              <>
                <h1>Timetable Grid</h1>
                <p>Interactive weekly scheduling planner. Review allocations by room or professor.</p>
              </>
            )}
            {activeTab === 'resources' && (
              <>
                <h1>Resource Directory</h1>
                <p>Configure course structures, available classrooms, and faculty instructor records.</p>
              </>
            )}
            {activeTab === 'conflicts' && (
              <>
                <h1>Conflicts Auditor</h1>
                <p>Review and audit active schedule collisions, hard overlaps, and preference alerts.</p>
              </>
            )}
          </div>
          
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
        </header>

        {/* Tab Components */}
        {activeTab === 'dashboard' && (
          <Dashboard data={data} onUpdateData={setData} />
        )}
        {activeTab === 'timetable' && (
          <TimetableGrid data={data} onUpdateData={setData} />
        )}
        {activeTab === 'resources' && (
          <ResourceManager data={data} onUpdateData={setData} refreshData={loadData} />
        )}
        {activeTab === 'conflicts' && (
          <ConflictsView data={data} />
        )}
      </main>
    </div>
  );
}
