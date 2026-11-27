import { useEffect, useState } from 'react';
import { api } from '../api.js';
import useMeta from '../useMeta.js';

const empty = { name: '', description: '', categories: [] };

export default function Departments() {
  const meta = useMeta();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/departments').then((d) => setList(d.departments)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const toggle = (c) => setForm({ ...form, categories: form.categories.includes(c) ? form.categories.filter((x) => x !== c) : [...form.categories, c] });

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api(editId ? `/departments/${editId}` : '/departments', { method: editId ? 'PUT' : 'POST', body: form });
      setForm(empty); setEditId(null); load();
    } catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await api(`/departments/${id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  };

  return (
    <>
      <h2>Departments</h2>
      {error && <div className="alert error">{error}</div>}
      <div className="grid2">
        <div className="card">
          <h3>{editId ? 'Edit department' : 'Add department'}</h3>
          <form onSubmit={submit}>
            <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Description<input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <fieldset><legend>Categories handled (used for auto-assignment)</legend>
              {meta?.categories.map((c) => <label key={c} className="check"><input type="checkbox" checked={form.categories.includes(c)} onChange={() => toggle(c)} /> {c}</label>)}
            </fieldset>
            <div className="row"><button className="btn">{editId ? 'Save' : 'Add'}</button>{editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setForm(empty); }}>Cancel</button>}</div>
          </form>
        </div>
        <div className="card">
          <h3>All departments</h3>
          {list.map((d) => (
            <div className="list-item" key={d._id}>
              <div><b>{d.name}</b><div className="muted small">{d.categories.join(', ') || 'No categories'}</div></div>
              <div className="row">
                <button className="btn small ghost" onClick={() => { setEditId(d._id); setForm({ name: d.name, description: d.description || '', categories: d.categories }); }}>Edit</button>
                <button className="btn small danger" onClick={() => remove(d._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
