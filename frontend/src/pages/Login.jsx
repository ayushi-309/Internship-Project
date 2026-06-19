import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, User, Check } from 'lucide-react';
import Toast from '../components/Toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availability, setAvailability] = useState('both');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          throw new Error('Please fill in all fields.');
        }
        const loggedUser = await login(email, password);
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          if (loggedUser.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1000);
      } else {
        if (!name || !email || !password) {
          throw new Error('Name, email, and password are required.');
        }
        const skillsString = selectedSkills.join(', ');
        await register(name, email, password, skillsString, availability);
        setSuccess('Account created successfully!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      <div className="glass-panel auth-card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '12px', 
            borderRadius: '50%', 
            background: 'var(--primary-glow)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: 'var(--accent-purple)',
            marginBottom: '16px'
          }}>
            <Heart size={32} fill="currentColor" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
            {isLogin ? 'Welcome Back' : 'Join NayePankh'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isLogin ? 'Log in to your NayePankh Foundation volunteer portal' : 'Sign up to start volunteering with NayePankh Foundation'}
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(0,0,0,0.2)', 
          padding: '4px', 
          borderRadius: '10px', 
          marginBottom: '24px' 
        }}>
          <button 
            type="button"
            className="btn"
            style={{ 
              flex: 1, 
              background: isLogin ? 'rgba(255,255,255,0.06)' : 'none', 
              color: isLogin ? '#fff' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className="btn"
            style={{ 
              flex: 1, 
              background: !isLogin ? 'rgba(255,255,255,0.06)' : 'none', 
              color: !isLogin ? '#fff' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="glass-input" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="glass-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          {!isLogin && (
            <>
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

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Select Your Skills</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '10px',
                  marginTop: '8px'
                }}>
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
                          padding: '10px',
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
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px', height: '48px' }}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <span 
                style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setIsLogin(false)}
              >
                Sign up
              </span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span 
                style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setIsLogin(true)}
              >
                Sign in
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
