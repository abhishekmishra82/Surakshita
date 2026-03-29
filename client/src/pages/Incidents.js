import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from '../components/Toast';
import ToastContainer from '../components/Toast';
import { useSOS } from '../context/SOSContext';
import { useAuth } from '../context/AuthContext';
import LoginPrompt from '../components/LoginPrompt';
import './Incidents.css';

const INCIDENT_TYPES = ['Harassment', 'Stalking', 'Unsafe Area', 'Assault', 'Suspicious Activity', 'Other'];

export default function Incidents() {
  const { currentLocation } = useSOS();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [form, setForm] = useState({ type: '', description: '', anonymous: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/incidents').then((r) => setIncidents(r.data.incidents)).catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/incidents', { ...form, location: currentLocation });
      toast.success('Incident reported');
      setForm({ type: '', description: '', anonymous: false });
      setShowForm(false);
      api.get('/incidents').then((r) => setIncidents(r.data.incidents)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="incidents-page">
      <ToastContainer />
      {showLogin && (
        <LoginPrompt
          featureLabel="report incidents"
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
      <div className="page-header">
        <h2>Incident Reports</h2>
        <button className="add-btn" onClick={() => {
          if (!user) { setShowLogin(true); return; }
          setShowForm(true);
        }}>+ Report</button>
      </div>

      {!user && (
        <div className="empty-state">
          <span>🔐</span>
          <p>Sign in to report and track incidents in your area.</p>
          <button className="add-btn" style={{ marginTop: 12 }} onClick={() => setShowLogin(true)}>Sign In</button>
        </div>
      )}

      {user && incidents.length === 0 && !showForm && (
        <div className="empty-state">
          <span>📋</span>
          <p>No incidents reported.</p>
        </div>
      )}

      <div className="incidents-list">
        {incidents.map((inc) => (
          <div key={inc._id} className="incident-card">
            <div className="incident-type">{inc.type}</div>
            {inc.description && <p className="incident-desc">{inc.description}</p>}
            <div className="incident-meta">
              <span>{new Date(inc.createdAt).toLocaleString()}</span>
              {inc.anonymous && <span className="anon-badge">Anonymous</span>}
              <span className={`status-badge ${inc.status}`}>{inc.status}</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Report Incident</h3>
            <form onSubmit={handleSubmit} className="incident-form">
              <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                <option value="">Select incident type *</option>
                {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea className="form-input" rows={4} placeholder="Describe what happened (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <label className="checkbox-label">
                <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />
                Report anonymously
              </label>
              {currentLocation && (
                <p className="location-note">📍 Your current location will be attached</p>
              )}
              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Reporting...' : 'Submit Report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
