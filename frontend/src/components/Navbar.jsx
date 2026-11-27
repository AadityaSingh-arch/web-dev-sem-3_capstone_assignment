import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <header className="navbar">
      <div className="brand">📣 CampusVoice</div>
      <nav>
        <NavLink to="/" end>{user.role === 'complainant' ? 'My Grievances' : 'Grievances'}</NavLink>
        {user.role === 'complainant' && <NavLink to="/new">New Grievance</NavLink>}
        {['officer', 'admin'].includes(user.role) && <NavLink to="/reports">Reports</NavLink>}
        {user.role === 'admin' && <NavLink to="/departments">Departments</NavLink>}
        {user.role === 'admin' && <NavLink to="/users">Users</NavLink>}
        <NavLink to="/notifications">🔔{unread > 0 && <span className="badge-count">{unread}</span>}</NavLink>
      </nav>
      <div className="user-box">
        <span>{user.name} <small className="muted">({user.role})</small></span>
        <button className="btn small ghost" onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
      </div>
    </header>
  );
}
