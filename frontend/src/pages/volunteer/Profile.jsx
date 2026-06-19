import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { User, Check, Save } from 'lucide-react';

export default function Profile() {
  const { user, token, updateUserInfo } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [selectedSkills, setSelectedSkills] = useState(
    user?.skills ? user.skills.split(',').map(s => s.trim()) : []
  );
  const [availability, setAvailability] = useState(user?.availability || 'both');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const skillsList = [
    'Teaching', 'Event Help', 'Cooking', 'IT Support', 
    'Gardening', 'Admin Support', 'Marketing', 'Advocacy'
  ];

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setSubmitting(true);

    try {
      const skillsString = selectedSkills.join(', ');
      
      const res = await fetch('/api/volunteers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, skills: skillsString, availability })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Profile updated successfully!');
        updateUserInfo(data.user);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Profile Settings" subtitle="Keep your skills and availability updated to receive matching events.">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      <div className="glass-panel" style={{ maxWidth: '640px', padding: '32px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} style={{ color: 'var(--primary)' }} /> Edit Profile Details
        </h3>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <input 
              type="text" 
              className="glass-input" 
              value={user?.email || ''} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="glass-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Your Name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Availability</label>
            <select 
              className="glass-select" 
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="both">Weekdays & Weekends (Flexible)</option>
              <option value="weekdays">Weekdays Only</option>
              <option value="weekends">Weekends Only</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">My Skills</label>
            <div className="profile-skills-grid">
              {skillsList.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    style={{
                      background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      padding: '12px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {skill}
                    {isSelected && <Check size={14} style={{ color: 'var(--accent-purple)' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', height: '48px' }}
            disabled={submitting}
          >
            <Save size={18} /> {submitting ? 'Saving changes...' : 'Save Profile Settings'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
