import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { Check, X, Edit2, AlertCircle, Clock } from 'lucide-react';

export default function HoursApproval() {
  const { token } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [adjustedHours, setAdjustedHours] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/admin/pending-hours', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending);
      }
    } catch (err) {
      console.error('Error fetching pending hours:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [token]);

  const handleAction = async (registrationId, approved, hrs = undefined) => {
    try {
      const body = { approved };
      if (hrs !== undefined) {
        body.adjustedHours = parseFloat(hrs);
        if (isNaN(body.adjustedHours) || body.adjustedHours < 0) {
          setError('Hours must be a non-negative number.');
          return;
        }
      }

      const res = await fetch(`/api/admin/approve-hours/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Action saved successfully!');
        setEditingId(null);
        setAdjustedHours('');
        fetchPending(); // refresh list
      } else {
        setError(data.message || 'Action failed.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const startEdit = (regId, currentHours) => {
    setEditingId(regId);
    setAdjustedHours(currentHours.toString());
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <Layout title="Hours Approval Queue" subtitle="Verify and approve hours logged by volunteers.">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading pending approvals...</div>
      ) : pending.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
          <h3>All caught up!</h3>
          <p style={{ marginTop: '8px' }}>There are no pending volunteer hours logs awaiting approval.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="table-container" style={{ marginTop: '0' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Event</th>
                  <th>Date Attended</th>
                  <th>Hours Logged</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => {
                  const isEditing = editingId === item.registration_id;
                  
                  return (
                    <tr key={item.registration_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.volunteer_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.volunteer_email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.event_title}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(item.event_date)}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="number" 
                              step="0.5"
                              value={adjustedHours}
                              onChange={(e) => setAdjustedHours(e.target.value)}
                              className="glass-input"
                              style={{ width: '80px', padding: '6px 8px', fontSize: '0.875rem' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>hrs</span>
                          </div>
                        ) : (
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} style={{ color: 'var(--primary)' }} />
                            {item.hours_logged.toFixed(1)} hrs
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleAction(item.registration_id, true, adjustedHours)}
                              className="btn btn-success btn-icon"
                              title="Confirm Adjustment"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="btn btn-secondary btn-icon"
                              title="Cancel Edit"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleAction(item.registration_id, true)}
                              className="btn btn-success btn-icon"
                              title="Approve As Is"
                              style={{ padding: '8px' }}
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => startEdit(item.registration_id, item.hours_logged)}
                              className="btn btn-secondary btn-icon"
                              title="Adjust Hours"
                              style={{ padding: '8px' }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleAction(item.registration_id, false)}
                              className="btn btn-danger btn-icon"
                              title="Reject Request"
                              style={{ padding: '8px' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
