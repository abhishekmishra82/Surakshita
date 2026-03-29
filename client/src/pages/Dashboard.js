import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import SOSButton from '../components/SOSButton';
import LiveMap from '../components/LiveMap';
import ToastContainer, { toast } from '../components/Toast';
import LoginPrompt from '../components/LoginPrompt';
import useShakeDetection from '../hooks/useShakeDetection';
import useVoiceActivation from '../hooks/useVoiceActivation';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { sosActive, currentLocation, locationError, triggerSOS } = useSOS();
  const [contacts, setContacts] = useState([]);
  const [activeJourney, setActiveJourney] = useState(null);
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sosHistory, setSosHistory] = useState([]);
  const [loginPrompt, setLoginPrompt] = useState(null);

  const isGuest = !user;

  useEffect(() => {
    if (!user) return;
    api.get('/contacts').then((r) => setContacts(r.data.contacts)).catch(() => {});
    api.get('/journey/active').then((r) => setActiveJourney(r.data.journey)).catch(() => {});
    api.get('/sos/history').then((r) => setSosHistory(r.data.events?.slice(0, 3))).catch(() => {});
  }, [user]);

  const requireAuth = (fn, label) => {
    if (user) return fn();
    setLoginPrompt(label);
  };

  const handleShake = useCallback(async () => {
    if (sosActive || !user) return;
    toast.info('Shake detected! Triggering SOS...');
    try {
      await triggerSOS('shake');
      toast.error('🚨 SOS triggered via shake!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'SOS failed');
    }
  }, [sosActive, triggerSOS, user]);

  const handleVoice = useCallback(async () => {
    if (sosActive || !user) return;
    toast.info('Voice keyword detected! Triggering SOS...');
    try {
      await triggerSOS('voice');
      toast.error('🚨 SOS triggered via voice!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'SOS failed');
    }
  }, [sosActive, triggerSOS, user]);

  useShakeDetection({
    threshold: user?.shakeThreshold || 25,
    onShake: handleShake,
    enabled: shakeEnabled && !!user && !sosActive,
  });

  useVoiceActivation({
    keyword: user?.safeWord || 'help me',
    onTrigger: handleVoice,
    enabled: voiceEnabled && !!user && !sosActive,
  });

  return (
    <div className="dashboard">
      <ToastContainer />

      {loginPrompt && (
        <LoginPrompt
          featureLabel={loginPrompt}
          onClose={() => setLoginPrompt(null)}
          onSuccess={() => setLoginPrompt(null)}
        />
      )}

      <div className="dashboard-greeting">
        <h2>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
        <p className="status-text">
          {isGuest
            ? '👋 Browsing as guest — sign in to activate safety features'
            : sosActive
            ? '🚨 Emergency mode active'
            : contacts.length === 0
            ? '⚠️ Add emergency contacts to activate SOS'
            : '✅ Safety features active'}
        </p>
      </div>

      {isGuest && (
        <div className="alert-card info">
          <span>ℹ️</span>
          <div>
            <strong>You're browsing as a guest</strong>
            <p>Sign in or create an account to use SOS, contacts, and journey tracking.</p>
            <button className="alert-link-btn" onClick={() => setLoginPrompt('access all safety features')}>
              Sign in now →
            </button>
          </div>
        </div>
      )}

      {!isGuest && contacts.length === 0 && (
        <div className="alert-card warning">
          <span>⚠️</span>
          <div>
            <strong>No emergency contacts</strong>
            <p>Add at least one contact to use SOS features.</p>
            <Link to="/contacts" className="alert-link">Add contacts →</Link>
          </div>
        </div>
      )}

      {activeJourney && (
        <div className="alert-card info">
          <span>🗺️</span>
          <div>
            <strong>Journey Active</strong>
            <p>To: {activeJourney.destination}</p>
            <p>ETA: {new Date(activeJourney.expectedArrival).toLocaleTimeString()}</p>
          </div>
        </div>
      )}

      <div className="sos-section">
        <SOSButton onGuestTap={() => setLoginPrompt('use the SOS emergency alert')} />
      </div>

      <div className="map-section">
        <h3 className="section-title">📍 Your Location</h3>
        {locationError && <p className="location-error">⚠️ {locationError}</p>}
        <div className="map-container">
          <LiveMap lat={currentLocation?.lat} lng={currentLocation?.lng} showRadius={sosActive} />
        </div>
        {currentLocation && (
          <p className="coords-text">
            {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-header">
            <span className="feature-icon">📳</span>
            <strong>Shake Detection</strong>
          </div>
          <p className="feature-desc">Shake your phone to trigger SOS</p>
          <label className="toggle" onClick={(e) => {
            if (isGuest) { e.preventDefault(); setLoginPrompt('enable shake detection'); }
          }}>
            <input type="checkbox" checked={shakeEnabled} onChange={(e) => setShakeEnabled(e.target.checked)} disabled={isGuest} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="feature-card">
          <div className="feature-header">
            <span className="feature-icon">🎤</span>
            <strong>Voice Activation</strong>
          </div>
          <p className="feature-desc">Say "{user?.safeWord || 'help me'}" to trigger SOS</p>
          <label className="toggle" onClick={(e) => {
            if (isGuest) { e.preventDefault(); setLoginPrompt('enable voice activation'); }
          }}>
            <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} disabled={isGuest} />
            <span className="toggle-slider" />
          </label>
        </div>

        <Link to="/journey" className="feature-card clickable" onClick={(e) => {
          if (isGuest) { e.preventDefault(); setLoginPrompt('use Safe Journey tracking'); }
        }}>
          <div className="feature-header">
            <span className="feature-icon">🗺️</span>
            <strong>Safe Journey</strong>
          </div>
          <p className="feature-desc">Track your route and notify contacts</p>
          <span className="feature-arrow">→</span>
        </Link>

        <Link to="/contacts" className="feature-card clickable" onClick={(e) => {
          if (isGuest) { e.preventDefault(); setLoginPrompt('manage emergency contacts'); }
        }}>
          <div className="feature-header">
            <span className="feature-icon">👥</span>
            <strong>Contacts</strong>
          </div>
          <p className="feature-desc">{user ? `${contacts.length} emergency contact${contacts.length !== 1 ? 's' : ''}` : 'Add emergency contacts'}</p>
          <span className="feature-arrow">→</span>
        </Link>
      </div>

      {sosHistory?.length > 0 && (
        <div className="history-section">
          <h3 className="section-title">Recent Alerts</h3>
          {sosHistory.map((e) => (
            <div key={e._id} className={`history-item status-${e.status}`}>
              <span>{e.triggeredBy === 'shake' ? '📳' : e.triggeredBy === 'voice' ? '🎤' : '🆘'}</span>
              <div>
                <strong>{e.status.replace('_', ' ').toUpperCase()}</strong>
                <p>{new Date(e.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
