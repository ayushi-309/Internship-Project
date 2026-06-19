import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { ToggleLeft, ToggleRight, Search, Clock, Award, AlertCircle } from 'lucide-react';

export default function VolunteerRoster() {
  const { token } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/admin/volunteers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data.volunteers);
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, [token]);

  const handleToggleStatus = async (volunteerId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/volunteers/${volunteerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Status updated successfully!');
        fetchVolunteers(); // refresh list
      } else {
        setError(data.message || 'Failed to update status.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const filteredVolunteers = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.skills.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Volunteer Roster" subtitle="Manage volunteer status records, skills, and cumulative hours.">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {/* Roster Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="glass-input" 
            placeholder="Search volunteers by name, email, or skill..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '44px', height: '44px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading volunteer directory...</div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
          <h3>No volunteers found</h3>
          <p style={{ marginTop: '8px' }}>No records match your query.</p>
        </div>
      ) : (
        <div className="table-container glass-panel" style={{ padding: '24px' }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Volunteer Info</th>
                <th>Skills & Tags</th>
                <th>Availability</th>
                <th>Approved Hours</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{v.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{v.email}</div>
                  </td>
                  <td style={{ maxWidth: '240px' }}>
                    {v.skills ? (
                      v.skills.split(',').map(s => (
                        <span key={s} className="skill-tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{s.trim()}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.9rem', textTransform: 'capitalize', fontWeight: 600 }}>
                      {v.availability}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      {v.total_hours > 10 ? (
                        <Award size={16} style={{ color: 'var(--warning)' }} title="Top Volunteer" />
                      ) : (
                        <Clock size={16} style={{ color: 'var(--primary)' }} />
                      )}
                      <span>{v.total_hours.toFixed(1)} hrs</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {formatDate(v.created_at)}
                  </td>
                  <td>
                    <span className={`status-pill ${v.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleToggleStatus(v.id, v.status)}
                      className="btn"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: v.status === 'active' ? '#34d399' : 'var(--text-muted)', 
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title={v.status === 'active' ? 'Deactivate Volunteer' : 'Activate Volunteer'}
                    >
                      {v.status === 'active' ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
