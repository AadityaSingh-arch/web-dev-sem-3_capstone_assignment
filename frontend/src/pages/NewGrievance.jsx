import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import useMeta from '../useMeta.js';

export default function NewGrievance() {
  const meta = useMeta();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: '', priority: 'medium', description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { grievance } = await api('/grievances', { method: 'POST', body: form });
      navigate(`/grievances/${grievance._id}`);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="card narrow">
      <h2>Submit a grievance</h2>
      <p className="muted">It will be routed automatically to the officer handling the chosen category.</p>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit}>
        <label>Title<input required minLength={5} maxLength={120} value={form.title} onChange={set('title')} /></label>
        <div className="grid2">
          <label>Category
            <select required value={form.category} onChange={set('category')}><option value="">Select…</option>{meta?.categories.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={set('priority')}>{meta?.priorities.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
        </div>
        <label>Description<textarea required minLength={10} rows={6} value={form.description} onChange={set('description')} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit grievance'}</button>
      </form>
    </div>
  );
}
