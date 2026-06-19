import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { Clock, Send, AlertCircle, FileText } from 'lucide-react';

export default function LogHours() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [selectedEventId, setSelectedEventId] = useState('');
  const [hours, setHours] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchEventsAndHistory = async () => {
    try {
      // 1. Fetch events to populate dropdown (users can log hours for registered events or any event)
      const eventsRes = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // 2. Fetch logging history
      const historyRes = await fetch('/api/registrations/my-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (eventsRes.ok && historyRes.ok) {
        const eventsData = await eventsRes.json();
        const historyData = await historyRes.json();

        setEvents(eventsData.events);
        setHistory(historyData.history);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndHistory();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEventId) {
      setError('Please select an event.');
      return;
    }

    const hrs = parseFloat(hours);
    if (isNaN(hrs) || hrs <= 0) {
      setError('Please enter a valid number of hours (> 0).');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/registrations/log-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: selectedEventId, hours: hrs })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Hours logged successfully!');
        setHours('');
        setSelectedEventId('');
        fetchEventsAndHistory(); // refresh logs
      } else {
        setError(data.message || 'Failed to log hours.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
    return 'Pending Approval';
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const completedEvents = events.filter(event => event.date <= todayStr);

  return (
    <Layout title="Log Volunteer Hours" subtitle="Submit your hours completed for community events.">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
      ) : (
        <div className="grid-2">
          {/* Hour Logging Form */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: 'var(--primary)' }} /> Log Hours Completed
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Event</label>
                <select 
                  className="glass-select"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="">-- Choose an Event --</option>
                  
                  {/* Option Groups for clarity */}
                  <optgroup label="Your Registered Events">
                    {completedEvents
                      .filter(e => e.user_registration_status === 'registered')
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.title} ({formatDate(e.date)})</option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Other Events">
                    {completedEvents
                      .filter(e => e.user_registration_status !== 'registered')
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.title} ({formatDate(e.date)})</option>
                      ))}
                  </optgroup>
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  If you attended an event without registering in advance, select it from "Other Events" to submit hours.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Hours Worked</label>
                <input 
                  type="number" 
                  step="0.5" 
                  className="glass-input" 
                  placeholder="e.g. 3.5" 
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '10px' }}
                disabled={submitting}
              >
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </form>
          </div>

          {/* Submission Logs List */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} /> Hours Submission Log
            </h3>

            {history.filter(log => log.hours_logged > 0 || log.status === 'attended').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ marginBottom: '10px', color: 'var(--text-muted)' }} />
                <p>No hours logged yet. Submit the form on the left to start logging hours.</p>
              </div>
            ) : (
              <div className="table-container" style={{ marginTop: '0', maxHeight: '350px' }}>
                <table className="glass-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .filter(log => log.hours_logged > 0 || log.status === 'attended')
                      .map(log => (
                        <tr key={log.registration_id}>
                          <td style={{ fontWeight: 600 }}>{log.title}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{formatDate(log.event_date)}</td>
                          <td style={{ fontWeight: 700 }}>{log.hours_logged.toFixed(1)}</td>
                          <td>
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
      )}
    </Layout>
  );
}
