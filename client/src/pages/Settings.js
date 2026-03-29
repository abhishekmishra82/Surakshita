import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from '../components/Toast';
import ToastContainer from '../components/Toast';
import './Settings.css';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    safeWord: user?.safeWord || 'help me',
    shakeThreshold: user?.shakeThreshold || 25,
    darkMode: user?.darkMode || false,
    stealthMode: user?.stealthMode || false,
  });
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/auth/settings', form);
      updateUser(res.data.user);
      document.documentElement.setAttribute('data-theme', form.darkMode ? 'dark' : 'light');
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/setup');
      setTwoFASetup(res.data);
    } catch {
      toast.error('Failed to setup 2FA');
    }
  };

  const verify2FA = async () => {
    try {
      await api.post('/auth/2fa/verify', { token: twoFAToken });
      updateUser({ twoFactorEnabled: true });
      setTwoFASetup(null);
      setTwoFAToken('');
      toast.success('2FA enabled successfully');
    } catch {
      toast.error('Invalid 2FA code');
    }
  };

  return (
    <div className="settings-page">
      <ToastContainer />
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Safety Preferences</h3>

        <div className="setting-row">
          <div>
            <strong>Voice Keyword</strong>
            <p>Say this phrase to trigger SOS</p>
          </div>
          <input
            className="setting-input"
            value={form.safeWord}
            onChange={(e) => setForm({ ...form, safeWord: e.target.value })}
            placeholder="e.g. help me"
          />
        </div>

        <div className="setting-row">
          <div>
            <strong>Shake Sensitivity</strong>
            <p>Lower = more sensitive ({form.shakeThreshold})</p>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            value={form.shakeThreshold}
            onChange={(e) => setForm({ ...form, shakeThreshold: Number(e.target.value) })}
            className="range-input"
          />
        </div>

        <div className="setting-row">
          <div>
            <strong>Dark Mode</strong>
            <p>Easier on eyes at night</p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={form.darkMode} onChange={(e) => setForm({ ...form, darkMode: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-row">
          <div>
            <strong>Stealth Mode</strong>
            <p>Screen dims during SOS, silent alerts</p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={form.stealthMode} onChange={(e) => setForm({ ...form, stealthMode: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>

        <button className="save-btn" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="settings-section">
        <h3>Two-Factor Authentication</h3>
        {user?.twoFactorEnabled ? (
          <div className="twofa-status enabled">✅ 2FA is enabled on your account</div>
        ) : (
          <>
            <p className="settings-desc">Add an extra layer of security with an authenticator app.</p>
            {!twoFASetup ? (
              <button className="outline-btn" onClick={setup2FA}>Setup 2FA</button>
            ) : (
              <div className="twofa-setup">
                <p>Scan this QR code with your authenticator app:</p>
                <img src={twoFASetup.qrCode} alt="2FA QR Code" className="qr-code" />
                <input
                  className="setting-input"
                  placeholder="Enter 6-digit code to verify"
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value)}
                  maxLength={6}
                />
                <button className="save-btn" onClick={verify2FA}>Verify & Enable 2FA</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="settings-section">
        <h3>Account</h3>
        <div className="account-info">
          <div className="account-row"><span>Name</span><strong>{user?.name || '—'}</strong></div>
          <div className="account-row"><span>Email</span><strong>{user?.email}</strong></div>
          <div className="account-row"><span>Account Type</span><strong>{user?.isAnonymous ? 'Anonymous' : 'Registered'}</strong></div>
        </div>
      </div>
    </div>
  );
}
