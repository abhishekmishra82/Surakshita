import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from '../components/Toast';
import ToastContainer from '../components/Toast';
import { useSOS } from '../context/SOSContext';
import { useAuth } from '../context/AuthContext';
import LoginPrompt from '../components/LoginPrompt';
import './Journey.css';

export default function Journey() {
  const { currentLocation } = useSOS();
  const { user } = useAuth();
  const [journey, setJourney] = useState(null);
  const [form, setForm] = useState({ destination: '', expectedArrival: '', checkInInterval: 15 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/journey/active').then((r) => setJourney(r.data.journey)).catch(() => {});
  }, [user]);

  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/journey/start', {
        ...form,
        startLocation: currentLocation,
      });
      setJourney(res.data.journey);
      setShowForm(false);
      toast.success('Journey started. Contacts will be notified if you\'re overdue.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start journey');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post(`/journey/${journey._id}/checkin`);
      setJourney({ ...journey, lastCheckIn: new Date().toISOString() });
      toast.success('Check-in successful!');
    } catch {
      toast.error('Check-in failed');
    }
  };

  const handleComplete = async () => {
    try {
      await api.post(`/journey/${journey._id}/complete`);
      setJourney(null);
      toast.success('Journey completed. Contacts notified of safe arrival!');
    } catch {
      toast.error('Failed to complete journey');
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const getTimeRemaining = () => {
    if (!journey) return '';
    const diff = new Date(journey.expectedArrival) - new Date();
    if (diff < 0) return 'Overdue!';
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m remaining` : `${mins}m remaining`;
  };

  return (
    <div className="journey-page">
      <ToastContainer />
      {showLogin && (
        <LoginPrompt
          featureLabel="use Safe Journey tracking"
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
      <div className="page-header">
        <h2>Safe Journey</h2>
        {!journey && (
          <button className="add-btn" onClick={() => {
            if (!user) { setShowLogin(true); return; }
            setShowForm(true);
          }}>+ Start Journey</button>
        )}
      </div>

      {!user && (
        <div className="empty-state">
          <span>🔐</span>
          <p>Sign in to start a safe journey and let your contacts track you.</p>
          <button className="add-btn" style={{ marginTop: 12 }} onClick={() => setShowLogin(true)}>Sign In</button>
        </div>
      )}

      {user && !journey && !showForm && (
        <div className="empty-state">
          <span>🗺️</span>
          <p>No active journey.</p>
          <p>Start a journey to let your contacts track your safety.</p>
        </div>
      )}

      {journey && (
        <div className="journey-card">
          <div className={`journey-status ${journey.status}`}>
            {journey.status === 'active' ? '🟢 Active' : journey.status === 'overdue' ? '🔴 Overdue' : journey.status}
          </div>
          <div className="journey-detail">
            <span>📍 Destination</span>
            <strong>{journey.destination}</strong>
          </div>
          <div className="journey-detail">
            <span>⏰ Expected Arrival</span>
            <strong>{new Date(journey.expectedArrival).toLocaleString()}</strong>
          </div>
          <div className="journey-detail">
            <span>⏱️ Time</span>
            <strong className={journey.status === 'overdue' ? 'overdue-text' : ''}>{getTimeRemaining()}</strong>
          </div>
          {journey.lastCheckIn && (
            <div className="journey-detail">
              <span>✅ Last Check-in</span>
              <strong>{new Date(journey.lastCheckIn).toLocaleTimeString()}</strong>
            </div>
          )}
          <div className="journey-actions">
            <button className="journey-btn checkin" onClick={handleCheckIn}>✅ Check In</button>
            <button className="journey-btn complete" onClick={handleComplete}>🏁 I Arrived Safely</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Start Safe Journey</h3>
            <form onSubmit={handleStart} className="journey-form">
              <label className="form-label">Destination *</label>
              <input className="form-input" placeholder="Where are you going?" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
              <label className="form-label">Expected Arrival Time *</label>
              <input className="form-input" type="datetime-local" min={getMinDateTime()} value={form.expectedArrival} onChange={(e) => setForm({ ...form, expectedArrival: e.target.value })} required />
              <label className="form-label">Check-in Interval (minutes)</label>
              <select className="form-input" value={form.checkInInterval} onChange={(e) => setForm({ ...form, checkInInterval: Number(e.target.value) })}>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
              </select>
              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Starting...' : 'Start Journey'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
