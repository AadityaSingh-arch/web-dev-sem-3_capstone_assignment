import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext.jsx';

export default function Notifications() {
  const { notifications, unread, markAllRead, markRead } = useNotifications();
  return (
    <>
      <div className="row between">
        <h2>Notifications <small className="muted">({unread} unread)</small></h2>
        <button className="btn small ghost" disabled={!unread} onClick={markAllRead}>Mark all read</button>
      </div>
      {notifications.length === 0 && <p className="card muted center">Nothing here yet.</p>}
      {notifications.map((n) => (
        <div key={n._id} className={`card notif ${n.read ? '' : 'unread'}`} onClick={() => !n.read && markRead(n._id)}>
          <div>{n.message}</div>
          <div className="row between"><small className="muted">{new Date(n.createdAt).toLocaleString()}</small>{n.grievance && <Link to={`/grievances/${n.grievance}`}>View</Link>}</div>
        </div>
      ))}
    </>
  );
}
