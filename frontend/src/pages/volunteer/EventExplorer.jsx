import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { Calendar, Clock, MapPin, Users, Check, Search, AlertCircle } from 'lucide-react';

export default function EventExplorer() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const handleRegister = async (eventId) => {
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(data.message || 'Successfully registered for the event!');
        fetchEvents();
      } else {
        setError(data.message || 'Could not register for event.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const handleCancel = async (eventId) => {
    try {
      const res = await fetch(`/api/registrations/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Registration cancelled.');
        fetchEvents();
      } else {
        setError(data.message || 'Could not cancel registration.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Filter logic
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSkill = skillFilter === '' || 
      event.skills_needed.toLowerCase().includes(skillFilter.toLowerCase());

    return matchesSearch && matchesSkill;
  });

  const getSkillsList = () => {
    const allSkills = new Set();
    events.forEach(e => {
      if (e.skills_needed) {
        e.skills_needed.split(',').forEach(s => {
          const trimS = s.trim();
          if (trimS) allSkills.add(trimS);
        });
      }
    });
    return Array.from(allSkills);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Layout title="Volunteer Opportunities" subtitle="Browse, filter, and register for upcoming community events.">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="glass-input" 
            placeholder="Search by title, description, or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '44px', height: '44px' }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <select 
            className="glass-select" 
            value={skillFilter} 
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{ height: '44px' }}
          >
            <option value="">Filter by Skill Needed</option>
            {getSkillsList().map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
        
        {user?.skills && (
          <button 
            className="btn btn-secondary" 
            style={{ height: '44px', fontSize: '0.85rem' }}
            onClick={() => {
              // Filter by user's first skill if exists
              const firstSkill = user.skills.split(',')[0].trim();
              setSkillFilter(firstSkill);
            }}
          >
            Match My Skills
          </button>
        )}

        {(searchQuery || skillFilter) && (
          <button 
            className="btn" 
            style={{ height: '44px', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'none' }}
            onClick={() => { setSearchQuery(''); setSkillFilter(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
          <h3>No events found</h3>
          <p style={{ marginTop: '8px' }}>Try adjusting your search queries or selecting a different skill filter.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => {
            const isRegistered = event.user_registration_status === 'registered';
            const isAttended = event.user_registration_status === 'attended';
            const isFull = event.max_volunteers !== null && event.current_volunteers >= event.max_volunteers;
            const isPast = event.date < todayStr;
            
            return (
              <div key={event.id} className="glass-panel glass-panel-hover event-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.2rem', lineHeight: '1.3' }}>{event.title}</h3>
                  {isRegistered && (
                    <span className="status-pill status-active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Registered
                    </span>
                  )}
                  {isAttended && (
                    <span className="status-pill status-approved">
                      Attended
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', flexGrow: 1, lineHeight: '1.5' }}>
                  {event.description}
                </p>

                <div className="event-meta">
                  <div className="meta-item">
                    <Calendar size={16} />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{event.time}</span>
                  </div>
                  <div className="meta-item">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                  <div className="meta-item">
                    <Users size={16} />
                    <span>
                      {event.current_volunteers} / {event.max_volunteers === null ? 'Unlimited' : `${event.max_volunteers} spots`} filled
                    </span>
                  </div>
                </div>

                {event.skills_needed && (
                  <div className="event-skills">
                    {event.skills_needed.split(',').map(skill => (
                      <span key={skill} className="skill-tag">{skill.trim()}</span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '20px' }}>
                  {isPast ? (
                    <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                      Past Event
                    </button>
                  ) : isRegistered ? (
                    <button 
                      onClick={() => handleCancel(event.id)} 
                      className="btn btn-danger" 
                      style={{ width: '100%' }}
                    >
                      Cancel Registration
                    </button>
                  ) : isAttended ? (
                    <button className="btn btn-success" style={{ width: '100%' }} disabled>
                      Hours Logged
                    </button>
                  ) : isFull ? (
                    <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                      Event Full
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRegister(event.id)} 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                    >
                      Register
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
