import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, Users, X } from 'lucide-react';

export default function EventManager() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [maxVolunteers, setMaxVolunteers] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const openCreateModal = () => {
    setIsEdit(false);
    setCurrentEventId(null);
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setSkillsNeeded('');
    setMaxVolunteers('');
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setIsEdit(true);
    setCurrentEventId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
    setTime(event.time);
    setLocation(event.location);
    setSkillsNeeded(event.skills_needed || '');
    setMaxVolunteers(event.max_volunteers !== null ? event.max_volunteers.toString() : '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !description || !date || !time || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    const body = {
      title,
      description,
      date,
      time,
      location,
      skills_needed: skillsNeeded,
      max_volunteers: maxVolunteers === '' ? null : parseInt(maxVolunteers, 10)
    };

    try {
      const url = isEdit ? `/api/events/${currentEventId}` : '/api/events';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
        setShowModal(false);
        fetchEvents();
      } else {
        setError(data.message || 'Action failed.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This will remove all volunteer registrations for it.')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Event deleted successfully!');
        fetchEvents();
      } else {
        setError(data.message || 'Failed to delete event.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <Layout title="Event Manager" subtitle="Create, edit, and delete volunteer operations.">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Create New Event
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading event list...</div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Calendar size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
          <h3>No events scheduled</h3>
          <p style={{ marginTop: '8px' }}>Click "Create New Event" to set up your first operations schedule.</p>
        </div>
      ) : (
        <div className="table-container glass-panel" style={{ padding: '24px' }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Event Info</th>
                <th>Schedule</th>
                <th>Location</th>
                <th>Capacity Details</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>{event.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxClamp: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {event.description}
                    </div>
                    {event.skills_needed && (
                      <div style={{ marginTop: '6px' }}>
                        {event.skills_needed.split(',').map(s => (
                          <span key={s} className="skill-tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{s.trim()}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Calendar size={14} style={{ color: 'var(--primary)' }} />
                      {formatDate(event.date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <Clock size={14} />
                      {event.time}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <MapPin size={14} style={{ color: 'var(--secondary)' }} />
                      {event.location}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Users size={14} />
                      <span>
                        {event.current_volunteers} / {event.max_volunteers === null ? 'Unlimited' : event.max_volunteers}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button 
                        onClick={() => openEditModal(event)} 
                        className="btn btn-secondary btn-icon"
                        title="Edit Event"
                        style={{ padding: '8px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(event.id)} 
                        className="btn btn-danger btn-icon"
                        title="Delete Event"
                        style={{ padding: '8px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal Overlay */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ animation: 'slideIn 0.3s ease forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.4rem' }}>{isEdit ? 'Edit Event Details' : 'Create New Event'}</h3>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Community Food Drive"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea 
                  className="glass-input" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Detailed description of volunteer tasks..."
                  style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input 
                    type="time" 
                    className="glass-input" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Central Community Center"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills Needed (comma-separated)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={skillsNeeded} 
                  onChange={(e) => setSkillsNeeded(e.target.value)} 
                  placeholder="e.g. Cooking, Event Help"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Volunteers (leave blank for unlimited)</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={maxVolunteers} 
                  onChange={(e) => setMaxVolunteers(e.target.value)} 
                  placeholder="e.g. 15"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2 }}
                >
                  {isEdit ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
