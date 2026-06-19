import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import EventExplorer from './pages/volunteer/EventExplorer';
import LogHours from './pages/volunteer/LogHours';
import Profile from './pages/volunteer/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import HoursApproval from './pages/admin/HoursApproval';
import EventManager from './pages/admin/EventManager';
import VolunteerRoster from './pages/admin/VolunteerRoster';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'grid', 
        placeContent: 'center', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #070a0f 100%)', 
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Authenticating Session...</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If an admin tries to view a volunteer page, send to /admin, and vice versa
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Authentication Page */}
          <Route path="/login" element={<Login />} />

          {/* Volunteer Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRole="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute allowedRole="volunteer">
              <EventExplorer />
            </ProtectedRoute>
          } />
          <Route path="/log-hours" element={
            <ProtectedRoute allowedRole="volunteer">
              <LogHours />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRole="volunteer">
              <Profile />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/approvals" element={
            <ProtectedRoute allowedRole="admin">
              <HoursApproval />
            </ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute allowedRole="admin">
              <EventManager />
            </ProtectedRoute>
          } />
          <Route path="/admin/volunteers" element={
            <ProtectedRoute allowedRole="admin">
              <VolunteerRoster />
            </ProtectedRoute>
          } />

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
