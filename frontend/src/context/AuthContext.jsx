import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:5000';

async function readJsonResponse(res) {
  const text = await res.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Server did not return valid JSON.');
  }
}

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
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await readJsonResponse(res);

        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await readJsonResponse(res);

    if (!res.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    localStorage.setItem('volunteer_token', data.token);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  };

  const register = async (name, email, password, skills = '', availability = 'both') => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, skills, availability })
    });

    const data = await readJsonResponse(res);

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
