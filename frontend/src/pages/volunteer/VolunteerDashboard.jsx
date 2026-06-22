import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Clock, Calendar, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = '';

export default function VolunteerDashboard() {
  const { token, user } = useAuth();

  const [stats, setStats] = useState({
    approvedHours: 0,
    pendingHours: 0,
    registeredCount: 0
  });

  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [hoursHistory, setHoursHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/volunteers/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (res.ok) {
          setStats(data.stats || { approvedHours: 0, pendingHours: 0, registeredCount: 0 });
          setRegisteredEvents(data.registeredEvents || []);
          setHoursHistory(data.hoursHistory || []);
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
    <Layout
      title={`👋 Welcome back, ${user?.name || 'Volunteer'}!`}
      subtitle="We're happy to have you volunteering with NayePankh Foundation."
    >
      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
          Loading your dashboard...
        </div>
      ) : (
        <>
          <div
            className="glass-panel dashboard-hover-card"
            style={{
              padding: '26px 28px',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '18px',
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(14,165,233,0.08))'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                Your volunteering impact is growing
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Track your hours, explore events, and keep contributing to meaningful causes.
              </p>
            </div>

            <div className="stat-icon-container stat-icon-primary">
              <Sparkles size={24} />
            </div>
          </div>

          <div className="stats-grid">
            <div className="glass-panel stat-card dashboard-hover-card">
              <div>
                <span className="stat-title">Approved Hours</span>
                <h3 className="stat-value">{stats.approvedHours} hrs</h3>
                <p className="mini-text">Great work completed</p>
              </div>
              <div className="stat-icon-container stat-icon-success">
                <Clock size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card dashboard-hover-card">
              <div>
                <span className="stat-title">Pending Hours</span>
                <h3 className="stat-value">{stats.pendingHours} hrs</h3>
                <p className="mini-text">Waiting for approval</p>
              </div>
              <div className="stat-icon-container stat-icon-primary">
                <Clock size={24} />
              </div>
            </div>

            <div className="glass-panel stat-card dashboard-hover-card">
              <div>
                <span className="stat-title">Registered Events</span>
                <h3 className="stat-value">{stats.registeredCount}</h3>
                <p className="mini-text">Events joined by you</p>
              </div>
              <div className="stat-icon-container stat-icon-secondary">
                <Calendar size={24} />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="glass-panel dashboard-hover-card" style={{ padding: '28px' }}>
              <div className="card-title-row">
                <h3 style={{ fontSize: '1.25rem' }}>Upcoming Schedules</h3>
                <Link to="/events" className="dashboard-link">
                  Explore Events <ChevronRight size={16} />
                </Link>
              </div>

              {registeredEvents.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={42} />
                  <h3>No events yet</h3>
                  <p>Explore volunteering opportunities and register for your first event.</p>
                  <Link to="/events" className="pretty-btn">
                    Find Opportunities
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {registeredEvents.map(event => (
                    <div key={event.event_id} className="glass-panel event-card">
                      <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>{event.title}</h4>
                      <p className="event-description">{event.description}</p>
                      <div className="event-meta">
                        <span>📅 {formatDate(event.date)}</span>
                        <span>⏰ {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel dashboard-hover-card" style={{ padding: '28px' }}>
              <div className="card-title-row">
                <h3 style={{ fontSize: '1.25rem' }}>Participation & Hours Log</h3>
                <Link to="/log-hours" className="dashboard-link">
                  Submit Hours <ChevronRight size={16} />
                </Link>
              </div>

              {hoursHistory.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={42} />
                  <h3>No hours logged yet</h3>
                  <p>Submit your volunteering hours after completing an event.</p>
                  <Link to="/log-hours" className="pretty-btn">
                    Submit Hours
                  </Link>
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
                          <td
                            style={{
                              padding: '10px',
                              fontWeight: 600,
                              maxWidth: '150px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {log.title}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                            {formatDate(log.date)}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>
                            {Number(log.hours_logged || 0).toFixed(1)}
                          </td>
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

          <footer
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              marginTop: '32px',
              fontSize: '0.85rem'
            }}
          >
            © 2026 NayePankh Foundation | Made with ❤️ by Ayushi Tiwari
          </footer>
        </>
      )}
    </Layout>
  );
}
