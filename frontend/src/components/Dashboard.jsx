import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle, BookOpen, Layers, ShieldAlert, Cpu } from 'lucide-react';
import { runAISolver, resetTimetableData } from '../utils/api';

export default function Dashboard({ data, onUpdateData }) {
  const [popSize, setPopSize] = useState(100);
  const [generations, setGenerations] = useState(150);
  const [mutationRate, setMutationRate] = useState(0.15);
  const [isSolving, setIsSolving] = useState(false);
  const [solveHistory, setSolveHistory] = useState([]);
  const [consoleLogs, setConsoleLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: "System ready. Click 'Run AI Solver' to resolve timetable conflicts.", type: 'info' }
  ]);
  const consoleEndRef = useRef(null);

  // Scroll console to bottom when logs update
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, { time, text, type }]);
  };

  const handleReset = async () => {
    if (isSolving) return;
    try {
      addLog("Resetting timetable to template dataset...", "warning");
      const freshData = await resetTimetableData();
      onUpdateData(freshData);
      setSolveHistory([]);
      addLog("Dataset successfully reset. 4 active conflicts introduced.", "success");
    } catch (err) {
      addLog(`Error resetting: ${err.message}`, "error");
    }
  };

  const handleSolve = async () => {
    if (isSolving) return;
    setIsSolving(true);
    setSolveHistory([]);
    setConsoleLogs([]);
    
    addLog(`Initializing Genetic Algorithm...`, "info");
    addLog(`Parameters: Population Size = ${popSize}, Max Generations = ${generations}, Mutation Rate = ${mutationRate * 100}%`, "info");
    addLog(`Generating initial population of ${popSize} candidate schedules...`, "info");

    try {
      // Trigger solver on backend
      const result = await runAISolver({
        population_size: popSize,
        generations: generations,
        mutation_rate: mutationRate
      });

      // We simulate the generations scrolling by in the console
      const history = result.history;
      let step = 0;
      
      const interval = setInterval(() => {
        if (step < history.length) {
          const h = history[step];
          const type = h.hard_conflicts === 0 ? 'success' : 'info';
          addLog(
            `Generation ${h.generation}/${generations}: Best Fitness = ${h.fitness.toFixed(4)} | Hard Conflicts = ${h.hard_conflicts} | Soft Conflicts = ${h.soft_conflicts}`,
            type
          );
          
          // Incremental chart history build up
          setSolveHistory(prev => [...prev, h]);
          step = Math.min(step + Math.max(1, Math.floor(history.length / 30)), history.length); // speed up log display
        } else {
          clearInterval(interval);
          
          // Complete data state updates
          const updatedData = {
            ...data,
            schedule: result.schedule,
            conflicts: result.conflicts
          };
          onUpdateData(updatedData);
          setSolveHistory(history);
          setIsSolving(false);

          if (result.hard_conflicts === 0) {
            addLog(`Optimization completed! All hard conflicts successfully resolved. Final Fitness: ${result.fitness.toFixed(4)}`, "success");
          } else {
            addLog(`Optimization finished. Solver stopped. ${result.hard_conflicts} hard conflicts remaining. Try increasing population size or generations.`, "warning");
          }
        }
      }, 50);

    } catch (err) {
      addLog(`Solver execution failed: ${err.message}`, "error");
      setIsSolving(false);
    }
  };

  // KPI Calculations
  const totalCourses = data.courses.length;
  
  const uniqueRoomsUsed = new Set(data.schedule.map(s => s.room_id)).size;
  const totalRooms = data.rooms.length;
  const roomUtilization = totalRooms > 0 ? Math.round((uniqueRoomsUsed / totalRooms) * 100) : 0;

  const hardConflicts = data.conflicts.filter(c => c.severity === 'hard').length;
  const softConflicts = data.conflicts.filter(c => c.severity === 'soft').length;

  // Render SVG Chart coordinates
  const renderChart = () => {
    if (solveHistory.length < 2) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No optimization data. Run the AI Solver to view learning progression.
        </div>
      );
    }

    const width = 600;
    const height = 180;
    const pad = 24;
    
    const maxGen = Math.max(...solveHistory.map(h => h.generation));
    const maxConfs = Math.max(...solveHistory.map(h => h.hard_conflicts + h.soft_conflicts), 5);

    // X: generation -> [pad, width - pad]
    // Y: value -> [height - pad, pad] (flipped)
    
    const getX = (gen) => pad + ((gen - 1) / (maxGen - 1)) * (width - 2 * pad);
    const getYFit = (fit) => height - pad - fit * (height - 2 * pad);
    const getYConf = (c) => height - pad - (c / maxConfs) * (height - 2 * pad);

    const fitnessPoints = solveHistory.map(h => `${getX(h.generation)},${getYFit(h.fitness)}`).join(' ');
    const conflictPoints = solveHistory.map(h => `${getX(h.generation)},${getYConf(h.hard_conflicts + h.soft_conflicts)}`).join(' ');

    return (
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Grids and Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--border-color)" strokeWidth="1" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--border-color)" strokeWidth="1" />
        
        {/* Fitness Line (Emerald) */}
        <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={fitnessPoints} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Conflicts Line (Rose/Purple) */}
        <polyline fill="none" stroke="#e11d48" strokeWidth="2.5" points={conflictPoints} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Labels */}
        <text x={pad + 10} y={pad + 12} fill="#10b981" fontSize="10" fontWeight="bold">Fitness (0 to 1)</text>
        <text x={width - pad - 120} y={pad + 12} fill="#e11d48" fontSize="10" fontWeight="bold">Conflicts (Count)</text>
        
        {/* Start / End Gen labels */}
        <text x={pad} y={height - pad + 14} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Gen 1</text>
        <text x={width - pad} y={height - pad + 14} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Gen {maxGen}</text>
      </svg>
    );
  };

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper accent">
            <BookOpen size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Courses Scheduled</span>
            <span className="kpi-value">{totalCourses}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper primary">
            <Layers size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Room Utilization</span>
            <span className="kpi-value">{roomUtilization}%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className={`kpi-icon-wrapper ${hardConflicts > 0 ? 'destructive' : 'primary'}`}>
            {hardConflicts > 0 ? <ShieldAlert size={24} /> : <CheckCircle size={24} />}
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Hard Conflicts</span>
            <span className="kpi-value" style={{ color: hardConflicts > 0 ? 'var(--destructive)' : 'var(--primary)' }}>
              {hardConflicts}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: softConflicts > 0 ? 'var(--warning-light)' : 'var(--accent-light)', color: softConflicts > 0 ? 'var(--warning)' : 'var(--accent)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Soft Conflicts</span>
            <span className="kpi-value" style={{ color: softConflicts > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {softConflicts}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Control/Chart, Right Logs */}
      <div className="panel-grid">
        
        {/* Left Side: Parameters & Chart */}
        <div>
          <div className="card">
            <div className="card-title">
              <span>AI Genetic Algorithm Solver</span>
              <span className="card-title-sub">Hyperparameters</span>
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span className="form-label">Population Size</span>
                <span className="slider-value">{popSize}</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="250" 
                value={popSize} 
                onChange={(e) => setPopSize(parseInt(e.target.value))} 
                disabled={isSolving}
                className="form-range"
              />
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span className="form-label">Max Generations</span>
                <span className="slider-value">{generations}</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="300" 
                value={generations} 
                onChange={(e) => setGenerations(parseInt(e.target.value))} 
                disabled={isSolving}
                className="form-range"
              />
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span className="form-label">Mutation Rate</span>
                <span className="slider-value">{(mutationRate * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.05" 
                max="0.40" 
                step="0.05" 
                value={mutationRate} 
                onChange={(e) => setMutationRate(parseFloat(e.target.value))} 
                disabled={isSolving}
                className="form-range"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={handleSolve} 
                disabled={isSolving} 
                className="btn btn-accent"
                style={{ flexGrow: 1 }}
              >
                <Cpu size={16} />
                {isSolving ? 'Resolving Conflicts...' : 'Run AI Solver'}
              </button>
              
              <button 
                onClick={handleReset} 
                disabled={isSolving} 
                className="btn btn-secondary"
                title="Reset schedule & introduce default conflicts"
              >
                <RotateCcw size={16} />
                Reset Data
              </button>
            </div>
          </div>

          {/* Convergence Chart */}
          <div className="card">
            <div className="card-title">
              <span>Convergence Performance</span>
              <span className="card-title-sub">Fitness vs. Conflict Reductions</span>
            </div>
            <div className="chart-container">
              {renderChart()}
            </div>
          </div>
        </div>

        {/* Right Side: Solver Console */}
        <div className="card" style={{ height: '100%', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">
            <span>Solver Engine Log Console</span>
            <span className="card-title-sub">Step-by-step Execution</span>
          </div>
          
          <div className="solver-console" style={{ flexGrow: 1, height: 'auto' }}>
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="console-line">
                <span className="console-timestamp">[{log.time}]</span>
                <span className={`
                  ${log.type === 'success' ? 'console-success' : ''} 
                  ${log.type === 'warning' ? 'console-warning' : ''}
                  ${log.type === 'error' ? 'btn-destructive' : ''}
                `}>
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
