import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, HelpCircle, Cpu, Sparkles } from 'lucide-react';
import { fetchNvidiaInsights } from '../utils/api';

export default function ConflictsView({ data }) {
  const conflicts = data.conflicts || [];
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const hardConflicts = conflicts.filter(c => c.severity === 'hard');
  const softConflicts = conflicts.filter(c => c.severity === 'soft');

  const handleGetNvidiaInsights = async () => {
    setLoadingAi(true);
    try {
      const insights = await fetchNvidiaInsights();
      setAiInsights(insights);
    } catch (err) {
      console.error("Failed to fetch NVIDIA AI insights:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const getConflictIcon = (type) => {
    switch (type) {
      case 'professor_clash':
        return <ShieldAlert size={20} />;
      case 'room_clash':
        return <ShieldAlert size={20} />;
      case 'capacity_overflow':
        return <AlertTriangle size={20} />;
      case 'room_type_mismatch':
        return <AlertTriangle size={20} />;
      default:
        return <HelpCircle size={20} />;
    }
  };

  const getConflictTitle = (type) => {
    switch (type) {
      case 'professor_clash': return 'Professor Schedule Overlap';
      case 'room_clash': return 'Room Booking Overlap';
      case 'capacity_overflow': return 'Classroom Capacity Exceeded';
      case 'room_type_mismatch': return 'Incorrect Room Type Allocation';
      case 'spacing_violation': return 'Course Spacing (Double booking on same day)';
      case 'afternoon_class': return 'Afternoon Class (Soft Preference)';
      default: return 'Scheduling Constraint Violation';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* NVIDIA AI Advisor Banner Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>NVIDIA NIM AI Advisor</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Powered by Llama 3.3 70B Instruct on NVIDIA AI Foundation Endpoints
              </p>
            </div>
          </div>

          <button 
            className="btn btn-accent" 
            onClick={handleGetNvidiaInsights} 
            disabled={loadingAi}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Cpu size={16} />
            {loadingAi ? 'Analyzing with NVIDIA AI...' : 'Analyze Conflicts with NVIDIA AI'}
          </button>
        </div>

        {aiInsights && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{aiInsights.source}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live AI Recommendation</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {aiInsights.advice}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <span>Conflict Auditing Inspector</span>
          <span className="card-title-sub">
            {conflicts.length} total warnings ({hardConflicts.length} hard, {softConflicts.length} soft)
          </span>
        </div>

        {conflicts.length === 0 ? (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            margin: '20px 0'
          }}>
            <CheckCircle size={56} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Timetable Fully Resolved!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '6px', maxWidth: '500px' }}>
                The AI engine has successfully optimized the schedule. There are 0 conflicts (no teacher overlaps, no room booking issues, capacity constraints met).
              </p>
            </div>
          </div>
        ) : (
          <div className="conflict-list">
            
            {/* Hard Conflicts First */}
            {hardConflicts.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--destructive)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 'bold' }}>
                  Hard Conflicts ({hardConflicts.length}) — Must Resolve
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {hardConflicts.map((c, idx) => (
                    <div key={`hard-${idx}`} className="conflict-item hard">
                      <div className="conflict-icon">
                        {getConflictIcon(c.type)}
                      </div>
                      <div className="conflict-content">
                        <span className="conflict-badge hard">
                          {c.type.replace('_', ' ')}
                        </span>
                        <h5 style={{ fontSize: '0.925rem', fontWeight: '700', marginBottom: '2px' }}>
                          {getConflictTitle(c.type)}
                        </h5>
                        <p className="conflict-desc">{c.description}</p>
                        <div className="conflict-sessions">
                          Affected Sessions: {c.session_ids.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Conflicts Next */}
            {softConflicts.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 'bold' }}>
                  Soft Preference Warnings ({softConflicts.length}) — Optimization Goals
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {softConflicts.map((c, idx) => (
                    <div key={`soft-${idx}`} className="conflict-item soft">
                      <div className="conflict-icon">
                        <Info size={20} />
                      </div>
                      <div className="conflict-content">
                        <span className="conflict-badge soft">
                          {c.type.replace('_', ' ')}
                        </span>
                        <h5 style={{ fontSize: '0.925rem', fontWeight: '700', marginBottom: '2px' }}>
                          {getConflictTitle(c.type)}
                        </h5>
                        <p className="conflict-desc">{c.description}</p>
                        <div className="conflict-sessions">
                          Affected Sessions: {c.session_ids.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
