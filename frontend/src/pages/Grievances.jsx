import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useMeta from '../useMeta.js';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx';

export default function Grievances() {
  const { user } = useAuth();
  const meta = useMeta();
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', q: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pages: 1, total: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 8 });
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      try { setResult(await api(`/grievances?${params}`)); setError(''); }
      catch (e) { setError(e.message); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [filters, page]);

  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };
  const title = { complainant: 'My Grievances', officer: 'Grievances assigned to me', admin: 'All Grievances' }[user.role];

  return (
    <>
      <div className="row between">
        <h2>{title} <small className="muted">({result.total})</small></h2>
        {user.role === 'complainant' && <Link className="btn" to="/new">+ New grievance</Link>}
      </div>
      <div className="card filters">
        <input placeholder="Search title / description…" value={filters.q} onChange={set('q')} />
        <select value={filters.status} onChange={set('status')}><option value="">All statuses</option>{meta?.statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
        <select value={filters.priority} onChange={set('priority')}><option value="">All priorities</option>{meta?.priorities.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filters.category} onChange={set('category')}><option value="">All categories</option>{meta?.categories.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? <p className="muted">Loading…</p> : result.data.length === 0 ? <p className="card muted center">No grievances found.</p> : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Ticket</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th>{user.role !== 'complainant' && <th>Complainant</th>}{user.role !== 'officer' && <th>Officer</th>}<th>Created</th></tr></thead>
            <tbody>
              {result.data.map((g) => (
                <tr key={g._id}>
                  <td><Link to={`/grievances/${g._id}`}>{g.ticketId}</Link></td>
                  <td>{g.title}</td><td>{g.category}</td>
                  <td><PriorityBadge priority={g.priority} /></td><td><StatusBadge status={g.status} /></td>
                  {user.role !== 'complainant' && <td>{g.complainant?.name}</td>}
                  {user.role !== 'officer' && <td>{g.assignedOfficer?.name || <span className="muted">Unassigned</span>}</td>}
                  <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="row center">
        <button className="btn small ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
        <span className="muted">Page {result.page || page} of {result.pages}</span>
        <button className="btn small ghost" disabled={page >= result.pages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </>
  );
}
