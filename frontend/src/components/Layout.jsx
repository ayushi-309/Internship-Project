import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  User, 
  CheckSquare, 
  PlusSquare, 
  Users, 
  LogOut,
  Heart
} from 'lucide-react';

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'V';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Define menu items based on role
  const volunteerMenu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Find Events', path: '/events', icon: <Calendar size={20} /> },
    { name: 'Log Hours', path: '/log-hours', icon: <Clock size={20} /> },
    { name: 'Profile Settings', path: '/profile', icon: <User size={20} /> }
  ];

  const adminMenu = [
    { name: 'Admin Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Hours Approval', path: '/admin/approvals', icon: <CheckSquare size={20} /> },
    { name: 'Event Manager', path: '/admin/events', icon: <PlusSquare size={20} /> },
    { name: 'Volunteer Roster', path: '/admin/volunteers', icon: <Users size={20} /> }
  ];

  const menuItems = user?.role === 'admin' ? adminMenu : volunteerMenu;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <Heart size={20} fill="#fff" />
          </div>
          <span className="logo-text">NayePankh</span>
        </div>

        <nav style={{ flexGrow: 1 }}>
          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Badge & Logout */}
        <div className="user-badge-container" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="user-badge">
            <div className="avatar">
              {getInitials(user?.name)}
            </div>
            <div className="user-info">
              <span className="user-name" title={user?.name}>{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="nav-item" 
            style={{ 
              width: '100%', 
              background: 'none', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header-container">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Status: <span style={{ color: user?.status === 'active' ? '#34d399' : '#f87171' }}>{user?.status}</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
}
