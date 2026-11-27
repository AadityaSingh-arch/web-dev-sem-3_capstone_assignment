import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useMeta from '../useMeta.js';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx';

const fmt = (d) => new Date(d).toLocaleString();

export default function GrievanceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const meta = useMeta();
  const [g, setG] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [remark, setRemark] = useState('');
  const [officers, setOfficers] = useState([]);
  const [officerId, setOfficerId] = useState('');

  const load = useCallback(async () => {
    try { setG((await api(`/grievances/${id}`)).grievance); } catch (e) { setError(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (user.role === 'admin') api('/users?role=officer').then((d) => setOfficers(d.users)).catch(() => {});
  }, [user.role]);

  const run = async (fn) => { setError(''); try { setG((await fn()).grievance); } catch (e) { setError(e.message); } };

  if (!g) return error ? <div className="alert error">{error}</div> : <p className="muted">Loading…</p>;

  const canWork = user.role === 'admin' || user.role === 'officer';
  const next = meta?.transitions[g.status] || [];

  return (
    <>
      <Link to="/">← Back</Link>
      {error && <div className="alert error">{error}</div>}
      <div className="card">
        <div className="row between">
          <h2>{g.title}</h2>
          <div className="row"><PriorityBadge priority={g.priority} /><StatusBadge status={g.status} /></div>
        </div>
        <p className="muted">{g.ticketId} · {g.category} · submitted {fmt(g.createdAt)}</p>
        <p className="pre">{g.description}</p>
        <div className="grid2 muted">
          <div>Complainant: <b>{g.complainant?.name}</b> ({g.complainant?.userType})</div>
          <div>Department: <b>{g.department?.name || '—'}</b></div>
          <div>Assigned officer: <b>{g.assignedOfficer?.name || 'Unassigned'}</b></div>
          {g.resolvedAt && <div>Resolved: <b>{fmt(g.resolvedAt)}</b></div>}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Status history</h3>
          <ul className="timeline">
            {g.statusHistory.map((h, i) => (
              <li key={i}><StatusBadge status={h.status} /> <small className="muted">{fmt(h.changedAt)}{h.changedBy ? ` · ${h.changedBy.name}` : ''}</small>{h.remarks && <div>{h.remarks}</div>}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Officer remarks</h3>
          {g.remarks.length === 0 && <p className="muted">No remarks yet.</p>}
          <ul className="timeline">
            {g.remarks.map((r) => <li key={r._id}><b>{r.officer?.name}</b> <small className="muted">{fmt(r.createdAt)}</small><div>{r.text}</div></li>)}
          </ul>
          {canWork && (
            <form onSubmit={(e) => { e.preventDefault(); run(() => api(`/grievances/${id}/remarks`, { method: 'POST', body: { text: remark } })).then(() => setRemark('')); }}>
              <textarea rows={2} required placeholder="Add a remark…" value={remark} onChange={(e) => setRemark(e.target.value)} />
              <button className="btn small">Add remark</button>
            </form>
          )}
        </div>
      </div>

      {canWork && next.length > 0 && (
        <div className="card">
          <h3>Update status</h3>
          <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => api(`/grievances/${id}/status`, { method: 'PATCH', body: { status, remarks } })).then(() => { setRemarks(''); setStatus(''); }); }}>
            <select required value={status} onChange={(e) => setStatus(e.target.value)}><option value="">New status…</option>{next.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
            <input className="grow" placeholder="Remarks (required to resolve / reject)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            <button className="btn">Update</button>
          </form>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="card">
          <h3>Reassign officer</h3>
          <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => api(`/grievances/${id}/assign`, { method: 'PATCH', body: { officerId } })); }}>
            <select required value={officerId} onChange={(e) => setOfficerId(e.target.value)}><option value="">Select officer…</option>{officers.map((o) => <option key={o._id} value={o._id}>{o.name} — {o.department?.name}</option>)}</select>
            <button className="btn">Assign</button>
          </form>
        </div>
      )}
    </>
  );
}
