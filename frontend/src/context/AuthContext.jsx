import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('volunteer_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('volunteer_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    localStorage.setItem('volunteer_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, skills = '', availability = 'both') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, skills, availability })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed.');
    }

    localStorage.setItem('volunteer_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const updateUserInfo = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUserInfo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
