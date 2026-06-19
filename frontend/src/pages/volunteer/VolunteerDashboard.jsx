import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Clock, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VolunteerDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({ approvedHours: 0, pendingHours: 0, registeredCount: 0 });
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [hoursHistory, setHoursHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/volunteers/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRegisteredEvents(data.registeredEvents);
          setHoursHistory(data.hoursHistory);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const getStatusClass = (status, approved) => {
    if (status === 'cancelled') return 'status-pill status-inactive';
    if (approved === 1) return 'status-pill status-approved';
    if (approved === -1) return 'status-pill status-rejected';
    return 'status-pill status-pending';
  };

  const getStatusText = (status, approved) => {
    if (status === 'cancelled') return 'Cancelled';
    if (approved === 1) return 'Approved';
    if (approved === -1) return 'Rejected';
    return 'Pending';
  };

  return (
    <Layout title="Dashboard" subtitle={`Welcome back, ${user?.name}! Thank you for volunteering with NayePankh Foundation.`}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading your dashboard...</div>
      ) : (
        <>
          {/* Stats Summary Card Row */}
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div>
                <span className="stat-title">Approved Hours</span>
                <h3 className="stat-value">{stats.approvedHours} hrs</h3>
              </div>
              <div className="stat-icon-container stat-icon-success">
                <Clock size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span className="stat-title">Pending Hours</span>
                <h3 className="stat-value">{stats.pendingHours} hrs</h3>
              </div>
              <div className="stat-icon-container stat-icon-primary">
                <Clock size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span className="stat-title">Registered Events</span>
                <h3 className="stat-value">{stats.registeredCount}</h3>
              </div>
              <div className="stat-icon-container stat-icon-secondary">
                <Calendar size={24} />
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Upcoming Registered Events */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div className="card-title-row">
                <h3 style={{ fontSize: '1.25rem' }}>Upcoming Schedules</h3>
                <Link to="/events" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                  Explore Events <ChevronRight size={16} />
                </Link>
              </div>

              {registeredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ marginBottom: '10px', color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '0.95rem', marginBottom: '16px' }}>No upcoming registered events.</p>
                  <Link to="/events" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Find Opportunities
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {registeredEvents.map(event => (
                    <div 
                      key={event.event_id} 
                      className="glass-panel" 
                      style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
                    >
                      <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>{event.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>📅 {formatDate(event.date)}</span>
                        <span>⏰ {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hours History */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div className="card-title-row">
                <h3 style={{ fontSize: '1.25rem' }}>Participation & Hours Log</h3>
                <Link to="/log-hours" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                  Submit Hours <ChevronRight size={16} />
                </Link>
              </div>

              {hoursHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ marginBottom: '10px', color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '0.95rem' }}>No hours logged yet.</p>
                </div>
              ) : (
                <div className="table-container" style={{ marginTop: '0' }}>
                  <table className="glass-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px' }}>Event</th>
                        <th style={{ padding: '10px' }}>Date</th>
                        <th style={{ padding: '10px' }}>Hours</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoursHistory.slice(0, 5).map(log => (
                        <tr key={log.registration_id}>
                          <td style={{ padding: '10px', fontWeight: 600, maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.title}</td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{formatDate(log.date)}</td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>{log.hours_logged.toFixed(1)}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <span className={getStatusClass(log.status, log.hours_approved)}>
                              {getStatusText(log.status, log.hours_approved)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
