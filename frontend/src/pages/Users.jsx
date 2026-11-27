import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const empty = { name: '', email: '', password: '', role: 'officer', department: '' };

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api('/users').then((d) => setUsers(d.users)).catch((e) => setError(e.message));
  useEffect(() => { load(); api('/departments').then((d) => setDepts(d.departments)); }, []);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { await api('/users', { method: 'POST', body: form }); setForm(empty); load(); } catch (err) { setError(err.message); }
  };
  const toggleActive = async (u) => {
    try { await api(`/users/${u._id}`, { method: 'PATCH', body: { isActive: !u.isActive } }); load(); } catch (err) { setError(err.message); }
  };

  return (
    <>
      <h2>Users</h2>
      {error && <div className="alert error">{error}</div>}
      <div className="card">
        <h3>Create officer / admin</h3>
        <form onSubmit={submit} className="grid3">
          <label>Name<input required value={form.name} onChange={set('name')} /></label>
          <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
          <label>Password<input type="password" required minLength={8} value={form.password} onChange={set('password')} /></label>
          <label>Role<select value={form.role} onChange={set('role')}><option value="officer">Officer</option><option value="admin">Admin</option></select></label>
          {form.role === 'officer' && <label>Department<select required value={form.department} onChange={set('department')}><option value="">Select…</option>{depts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>}
          <div className="end"><button className="btn">Create</button></div>
        </form>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.department?.name || '—'}</td>
                <td>{u.isActive ? 'Active' : <span className="muted">Deactivated</span>}</td>
                <td>{u._id !== me._id && <button className="btn small ghost" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
