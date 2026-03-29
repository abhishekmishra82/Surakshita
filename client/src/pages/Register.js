import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      if (res.data.autoVerified) {
        // Dev mode: email not configured, auto-verified
        navigate('/login');
      } else {
        setUserId(res.data.userId);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { userId, otp });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      await api.post('/auth/resend-otp', { userId });
      setError('');
    } catch {}
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{width:52,height:52,fill:'none',stroke:'white',strokeWidth:2}}>
            <path d="M32 4 L54 14 L54 32 C54 45 44 56 32 60 C20 56 10 45 10 32 L10 14 Z" strokeLinejoin="round"/>
            <path d="M32 10 L50 18 L50 32 C50 42 42 51 32 55 C22 51 14 42 14 32 L14 18 Z" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
            <polyline points="22,32 29,39 42,26" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="auth-title">SURAKSHITA</h1>
        <p className="auth-tagline">One Step Towards Women's Safety</p>
        <p className="auth-subtitle">Create your account</p>

        {step === 1 ? (
          <form onSubmit={handleRegister} className="auth-form">
            <input className="auth-input" type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
            <input className="auth-input" type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
            <input className="auth-input" type="tel" name="phone" placeholder="Phone number (with country code)" value={form.phone} onChange={handleChange} />
            <input className="auth-input" type="password" name="password" placeholder="Password (min 8 chars)" value={form.password} onChange={handleChange} required minLength={8} />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn primary" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <p className="auth-link">Already have an account? <Link to="/login">Sign In</Link></p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="auth-form">
            <p className="auth-info">We sent a 6-digit OTP to <strong>{form.email}</strong></p>
            <input className="auth-input otp-input" type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} autoFocus />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button type="button" className="auth-btn ghost" onClick={resendOTP}>Resend OTP</button>
          </form>
        )}
      </div>
    </div>
  );
}
