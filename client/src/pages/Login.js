import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const SurakshitaLogo = () => (
  <div className="auth-logo">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4 L54 14 L54 32 C54 45 44 56 32 60 C20 56 10 45 10 32 L10 14 Z"
        stroke="white" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      <path d="M32 10 L50 18 L50 32 C50 42 42 51 32 55 C22 51 14 42 14 32 L14 18 Z"
        stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)" strokeLinejoin="round"/>
      <polyline points="22,32 29,39 42,26" stroke="white" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  </div>
);

export default function Login() {
  const { login, loginAnonymous } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [twoFA, setTwoFA] = useState({ show: false, userId: '', token: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fillDemo = () => setForm({ email: 'email123@gmail.com', password: '@Email1234' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.requires2FA) {
        setTwoFA({ show: true, userId: res.data.userId, token: '' });
      } else {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/2fa/verify', { userId: twoFA.userId, token: twoFA.token });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = () => {
    loginAnonymous();
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SurakshitaLogo />
        <h1 className="auth-title">SURAKSHITA</h1>
        <p className="auth-tagline">One Step Towards Women's Safety</p>
        <p className="auth-subtitle">Sign in to your account</p>

        {twoFA.show ? (
          <form onSubmit={handle2FA} className="auth-form">
            <p className="auth-info">Enter your 2FA code from your authenticator app</p>
            <input className="auth-input otp-input" type="text" placeholder="6-digit code"
              value={twoFA.token} onChange={(e) => setTwoFA({ ...twoFA, token: e.target.value })}
              maxLength={6} autoFocus />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-demo-box">
              <p>Demo account available:</p>
              <strong>📧 email123@gmail.com</strong>
              <strong>🔑 @Email1234</strong>
              <button type="button" className="auth-btn ghost" style={{padding:'6px 0', marginTop:4}} onClick={fillDemo}>
                Fill demo credentials →
              </button>
            </div>

            <input className="auth-input" type="email" name="email" placeholder="Email address"
              value={form.email} onChange={handleChange} required autoComplete="email" />
            <input className="auth-input" type="password" name="password" placeholder="Password"
              value={form.password} onChange={handleChange} required autoComplete="current-password" />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="auth-divider"><span>or</span></div>

            <button type="button" className="auth-btn secondary" onClick={handleAnonymous} disabled={loading}>
              👤 Continue as Guest
            </button>
            <p className="auth-link">Don't have an account? <Link to="/register">Register</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
