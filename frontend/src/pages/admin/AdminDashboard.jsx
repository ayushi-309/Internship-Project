import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Users, Calendar, Clock, Download, CheckSquare } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ activeVolunteers: 0, totalEvents: 0, totalHours: 0, pendingRequests: 0 });
  const [hoursByEvent, setHoursByEvent] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [monthlyRegistrations, setMonthlyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/admin/reports/summary', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setHoursByEvent(data.hoursByEvent);
          setSkillsData(data.skillsData);
          setMonthlyRegistrations(data.monthlyRegistrations);
        }
      } catch (err) {
        console.error('Error fetching admin reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handleCSVDownload = async (endpoint, filename) => {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate report. Server returned error.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Network error downloading CSV.');
    }
  };

  // Custom SVG Bar Chart: Approved Hours by Event
  const renderHoursChart = () => {
    if (hoursByEvent.length === 0) {
      return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No hours data logged yet.</div>;
    }

    const width = 500;
    const height = 240;
    const paddingLeft = 40;
    const paddingBottom = 40;
    const paddingTop = 20;
    const paddingRight = 20;
    
    const maxVal = Math.max(...hoursByEvent.map(e => e.approved_hours), 5);
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barSpacing = 16;
    const numBars = hoursByEvent.length;
    const barWidth = (chartWidth - barSpacing * (numBars + 1)) / numBars;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
        <defs>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = paddingTop + chartHeight - ratio * chartHeight;
          const gridVal = (ratio * maxVal).toFixed(0);
          return (
            <g key={index}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">{gridVal}h</text>
            </g>
          );
        })}

        {/* Bars */}
        {hoursByEvent.map((item, index) => {
          const h = (item.approved_hours / maxVal) * chartHeight;
          const x = paddingLeft + barSpacing + index * (barWidth + barSpacing);
          const y = paddingTop + chartHeight - h;
          
          return (
            <g key={item.id}>
              {/* Bar */}
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={h} 
                fill="url(#purpleGrad)" 
                rx="4" 
                className="svg-bar"
              />
              {/* Value Label */}
              {item.approved_hours > 0 && (
                <text 
                  x={x + barWidth / 2} 
                  y={y - 6} 
                  fill="#fff" 
                  fontSize="10" 
                  fontWeight="600" 
                  textAnchor="middle"
                >
                  {item.approved_hours.toFixed(0)}h
                </text>
              )}
              {/* X Axis Label */}
              <text 
                x={x + barWidth / 2} 
                y={paddingTop + chartHeight + 16} 
                fill="var(--text-secondary)" 
                fontSize="9" 
                textAnchor="middle"
                transform={`rotate(-15, ${x + barWidth / 2}, ${paddingTop + chartHeight + 16})`}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {item.title.length > 10 ? `${item.title.slice(0, 8)}...` : item.title}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Custom SVG Horizontal Bar Chart: Volunteer Skills Distribution
  const renderSkillsChart = () => {
    if (skillsData.length === 0) {
      return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No volunteer skills registered.</div>;
    }

    const width = 500;
    const height = 240;
    const paddingLeft = 100; // room for skill labels
    const paddingRight = 40;
    const paddingTop = 10;
    const paddingBottom = 10;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const maxVal = Math.max(...skillsData.map(s => s.value), 2);
    const rowHeight = chartHeight / Math.min(skillsData.length, 6);
    const barHeight = rowHeight * 0.5;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
        <defs>
          <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {skillsData.slice(0, 6).map((item, index) => {
          const w = (item.value / maxVal) * chartWidth;
          const y = paddingTop + index * rowHeight + (rowHeight - barHeight) / 2;
          
          return (
            <g key={item.name}>
              {/* Skill Label */}
              <text 
                x={paddingLeft - 12} 
                y={y + barHeight / 2 + 4} 
                fill="var(--text-secondary)" 
                fontSize="11" 
                fontWeight="600" 
                textAnchor="end"
              >
                {item.name}
              </text>
              {/* Bar track background */}
              <rect 
                x={paddingLeft} 
                y={y} 
                width={chartWidth} 
                height={barHeight} 
                fill="rgba(255,255,255,0.02)" 
                rx="3" 
              />
              {/* Fill Bar */}
              <rect 
                x={paddingLeft} 
                y={y} 
                width={w} 
                height={barHeight} 
                fill="url(#cyanGrad)" 
                rx="3" 
                className="svg-bar"
              />
              {/* Value Label */}
              <text 
                x={paddingLeft + w + 8} 
                y={y + barHeight / 2 + 4} 
                fill="#fff" 
                fontSize="11" 
                fontWeight="700"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Custom SVG Area Line Chart: Monthly Registrations Trend
  const renderRegistrationsChart = () => {
    if (monthlyRegistrations.length === 0) {
      return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No registrations trend data.</div>;
    }

    const width = 500;
    const height = 240;
    const paddingLeft = 30;
    const paddingBottom = 30;
    const paddingTop = 20;
    const paddingRight = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const maxVal = Math.max(...monthlyRegistrations.map(r => r.count), 2);
    
    // Build path coordinates
    const points = monthlyRegistrations.map((item, index) => {
      const x = paddingLeft + (index / (monthlyRegistrations.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (item.count / maxVal) * chartHeight;
      return { x, y, label: item.month, val: item.count };
    });

    let dPath = '';
    let dArea = '';

    if (points.length > 0) {
      dPath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      dArea = `${dPath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight - ratio * chartHeight;
          const gridVal = (ratio * maxVal).toFixed(0);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={paddingLeft - 6} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end">{gridVal}</text>
            </g>
          );
        })}

        {/* Gradient Area */}
        {dArea && <path d={dArea} fill="url(#areaGrad)" />}

        {/* Line */}
        {dPath && <path d={dPath} fill="none" stroke="#a78bfa" strokeWidth="2.5" />}

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="5" fill="#a78bfa" stroke="#090d16" strokeWidth="1.5" />
            {/* Value above dot */}
            <text x={p.x} y={p.y - 8} fill="#fff" fontSize="9" fontWeight="700" textAnchor="middle">{p.val}</text>
            {/* Month label */}
            <text x={p.x} y={paddingTop + chartHeight + 16} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">{p.label}</text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <Layout title="Admin Command Center" subtitle="NayePankh Foundation — Track volunteer participation and generate operations reports.">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Gathering reporting data...</div>
      ) : (
        <>
          {/* Analytics Stat Cards */}
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div>
                <span className="stat-title">Active Volunteers</span>
                <h3 className="stat-value">{stats.activeVolunteers}</h3>
              </div>
              <div className="stat-icon-container stat-icon-primary">
                <Users size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span className="stat-title">Active Events</span>
                <h3 className="stat-value">{stats.totalEvents}</h3>
              </div>
              <div className="stat-icon-container stat-icon-secondary">
                <Calendar size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span className="stat-title">Total Approved Hours</span>
                <h3 className="stat-value">{stats.totalHours.toFixed(0)} hrs</h3>
              </div>
              <div className="stat-icon-container stat-icon-success">
                <Clock size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span className="stat-title">Pending Approvals</span>
                <h3 className="stat-value" style={{ color: stats.pendingRequests > 0 ? 'var(--warning)' : 'inherit' }}>
                  {stats.pendingRequests}
                </h3>
              </div>
              <div className="stat-icon-container stat-icon-secondary" style={{ background: stats.pendingRequests > 0 ? 'rgba(245, 158, 11, 0.15)' : '', borderColor: stats.pendingRequests > 0 ? 'rgba(245, 158, 11, 0.3)' : '', color: stats.pendingRequests > 0 ? 'var(--warning)' : '' }}>
                <CheckSquare size={24} />
              </div>
            </div>
          </div>

          {/* Export Actions Panel */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px', display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>Download CSV Reports</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Download structured CSV logs for spreadsheet analyses.</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleCSVDownload('/api/admin/reports/export/volunteers', 'volunteers_report.csv')} 
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Volunteers CSV
              </button>
              <button 
                onClick={() => handleCSVDownload('/api/admin/reports/export/events', 'events_report.csv')} 
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Events CSV
              </button>
            </div>
          </div>

          {/* SVG Charts Grid */}
          <div className="grid-2" style={{ marginBottom: '30px' }}>
            <div className="glass-panel chart-container">
              <h4 className="chart-title">Hours logged per Event</h4>
              {renderHoursChart()}
            </div>

            <div className="glass-panel chart-container">
              <h4 className="chart-title">Volunteer Skills Share</h4>
              {renderSkillsChart()}
            </div>
          </div>

          <div className="grid-2">
            <div className="glass-panel chart-container" style={{ gridColumn: 'span 2' }}>
              <h4 className="chart-title">New Volunteer Registrations (Last 6 Months)</h4>
              {renderRegistrationsChart()}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
