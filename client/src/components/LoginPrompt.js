import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './LoginPrompt.css';

/**
 * Slide-up modal that appears when a guest tries to use a feature.
 * Props:
 *   onClose()       — called when dismissed
 *   onSuccess()     — called after successful login/anon
 *   featureLabel    — e.g. "use SOS", "add contacts"
 */
export default function LoginPrompt({ onClose, onSuccess, featureLabel = 'use this feature' }) {
  const { login, loginAnonymous } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('choice'); // 'choice' | 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAnon = () => {
    loginAnonymous();
    onSuccess?.();
    onClose?.();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      if (res.data.autoVerified) {
        // Dev mode — auto verified, log them in
        const loginRes = await api.post('/auth/login', { email: form.email, password: form.password });
        login(loginRes.data.token, loginRes.data.user);
        onSuccess?.();
        onClose?.();
      } else {
        // Redirect to full register page for OTP step
        onClose?.();
        navigate('/register');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-overlay" onClick={onClose}>
      <div className="lp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lp-handle" />

        {mode === 'choice' && (
          <>
            <div className="lp-icon">🔐</div>
            <h2 className="lp-title">Sign in to continue</h2>
            <p className="lp-desc">You need an account to {featureLabel}.</p>

            <div className="lp-actions">
              <button className="lp-btn primary" onClick={() => setMode('login')}>Sign In</button>
              <button className="lp-btn outline" onClick={() => setMode('register')}>Create Account</button>
              <div className="lp-divider"><span>or</span></div>
              <button className="lp-btn ghost" onClick={handleAnon}>
                Continue as Guest
                <span className="lp-ghost-note">No account needed — limited features</span>
              </button>
            </div>

            <button className="lp-close" onClick={onClose}>Maybe later</button>
          </>
        )}

        {mode === 'login' && (
          <>
            <button className="lp-back" onClick={() => { setMode('choice'); setError(''); }}>← Back</button>
            <h2 className="lp-title">Sign In</h2>
            <form onSubmit={handleLogin} className="lp-form">
              <input className="lp-input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required autoFocus />
              <input className="lp-input" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              {error && <p className="lp-error">{error}</p>}
              <button className="lp-btn primary" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        )}

        {mode === 'register' && (
          <>
            <button className="lp-back" onClick={() => { setMode('choice'); setError(''); }}>← Back</button>
            <h2 className="lp-title">Create Account</h2>
            <form onSubmit={handleRegister} className="lp-form">
              <input className="lp-input" type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required autoFocus />
              <input className="lp-input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <input className="lp-input" type="password" name="password" placeholder="Password (min 8 chars)" value={form.password} onChange={handleChange} required minLength={8} />
              {error && <p className="lp-error">{error}</p>}
              <button className="lp-btn primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
