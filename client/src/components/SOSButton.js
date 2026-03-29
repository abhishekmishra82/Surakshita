import React, { useState, useCallback } from 'react';
import { useSOS } from '../context/SOSContext';
import { useAuth } from '../context/AuthContext';
import './SOSButton.css';

export default function SOSButton({ onGuestTap }) {
  const { sosActive, triggerSOS, cancelSOS } = useSOS();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [countdownTimer, setCountdownTimer] = useState(null);
  const [error, setError] = useState('');

  const startCountdown = useCallback(() => {
    // Guest — show login prompt instead
    if (!user) {
      onGuestTap?.();
      return;
    }
    if (sosActive || loading) return;
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        setCountdown(null);
        handleTrigger();
      } else {
        setCountdown(count);
      }
    }, 1000);
    setCountdownTimer(timer);
  }, [sosActive, loading, user, onGuestTap]);

  const cancelCountdown = useCallback(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    setCountdown(null);
  }, [countdownTimer]);

  const handleTrigger = async () => {
    setLoading(true);
    setError('');
    try {
      await triggerSOS('button');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to trigger SOS');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelSOS(false);
    } catch {
      setError('Failed to cancel SOS');
    } finally {
      setLoading(false);
    }
  };

  if (sosActive) {
    return (
      <div className="sos-active-container">
        <div className="sos-pulse-ring" />
        <div className="sos-pulse-ring delay" />
        <button className="sos-btn active" onClick={handleCancel} disabled={loading}>
          <span className="sos-label">{loading ? '...' : 'SOS ACTIVE'}</span>
          <span className="sos-sub">Tap to cancel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="sos-wrapper">
      {countdown !== null ? (
        <div className="sos-countdown-container">
          <div className="sos-countdown-ring">
            <span className="sos-countdown-num">{countdown}</span>
          </div>
          <p className="sos-countdown-text">Sending SOS in {countdown}...</p>
          <button className="cancel-countdown-btn" onClick={cancelCountdown}>Cancel</button>
        </div>
      ) : (
        <button
          className={`sos-btn idle ${!user ? 'guest' : ''}`}
          onPointerDown={startCountdown}
          disabled={loading}
          aria-label="Hold to trigger SOS emergency alert"
        >
          <span className="sos-label">SOS</span>
          <span className="sos-sub">{user ? 'Hold to activate' : 'Sign in to use'}</span>
        </button>
      )}
      {error && <p className="sos-error">{error}</p>}
    </div>
  );
}
