import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', userType: 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await register(form); navigate('/', { replace: true }); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth-card card">
      <h1>Create account</h1>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit}>
        <label>Full name<input required minLength={2} value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Password (min 8 characters)<input type="password" required minLength={8} value={form.password} onChange={set('password')} /></label>
        <label>I am a
          <select value={form.userType} onChange={set('userType')}><option value="student">Student</option><option value="staff">Staff member</option></select>
        </label>
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      </form>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </div>
  );
}
