import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function Bars({ rows, labelKey, valueKey }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  return rows.length === 0 ? <p className="muted">No data.</p> : (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r[labelKey]}>
          <span className="bar-label">{String(r[labelKey]).replace('_', ' ')}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(r[valueKey] / max) * 100}%` }} /></div>
          <span className="bar-val">{r[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/reports/summary').then(setD).catch((e) => setError(e.message)); }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!d) return <p className="muted">Loading…</p>;
  const t = d.totals;

  return (
    <>
      <h2>Reports {user.role === 'officer' && <small className="muted">(my grievances)</small>}</h2>
      <div className="stats">
        <div className="card stat"><b>{t.total}</b><span>Total</span></div>
        <div className="card stat"><b>{t.pending}</b><span>Pending / in progress</span></div>
        <div className="card stat"><b>{t.resolved}</b><span>Resolved</span></div>
        <div className="card stat"><b>{t.rejected}</b><span>Rejected</span></div>
        <div className="card stat"><b>{t.avgResolutionHours ?? '—'}</b><span>Avg resolution (hours)</span></div>
      </div>
      <div className="grid2">
        <div className="card"><h3>By status</h3><Bars rows={d.byStatus} labelKey="_id" valueKey="count" /></div>
        <div className="card"><h3>By category</h3><Bars rows={d.byCategory} labelKey="_id" valueKey="count" /></div>
      </div>
      <div className="card table-wrap">
        <h3>Department performance</h3>
        <table>
          <thead><tr><th>Department</th><th>Total</th><th>Pending</th><th>Resolved</th><th>Avg resolution time (h)</th></tr></thead>
          <tbody>{d.byDepartment.map((r) => <tr key={r.department}><td>{r.department}</td><td>{r.total}</td><td>{r.pending}</td><td>{r.resolved}</td><td>{r.avgResolutionHours ?? '—'}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
