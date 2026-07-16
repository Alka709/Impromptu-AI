import { Home, Mic, User, Settings, LogOut, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppLogo = () => (
  <div className="app-logo">
    <Mic className="app-logo-icon" size={26} strokeWidth={2} />
    <span className="app-logo-text">Impromptu AI</span>
  </div>
);

export const Sidebar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {}
    setUser(null);
  };

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-logo">
        <AppLogo />
      </div>
      <div className="sidebar-nav">
        <div className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
          <Home size={20} /> Overview
        </div>
        <div className={`nav-item ${location.pathname === '/new-session' ? 'active' : ''}`} onClick={() => navigate('/new-session')}>
          <Mic size={20} /> Sessions
        </div>
        <div className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`} onClick={() => navigate('/history')}>
          <Clock size={20} /> History
        </div>
        <div className="nav-item"><User size={20} /> Profile</div>
        <div className="nav-item"><Settings size={20} /> Settings</div>
      </div>
      <div className="nav-item" onClick={logout}><LogOut size={20} /> Log Out</div>
    </div>
  );
};