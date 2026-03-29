import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { sendSOSEmail } from '../services/emailAlert';
import { useAuth } from './AuthContext';

const SOSContext = createContext(null);

export const SOSProvider = ({ children }) => {
  const { user } = useAuth();
  const isAnon = user?.isAnonymous;

  const [sosActive, setSosActive] = useState(false);
  const [sosId, setSosId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Connect socket — only for registered users
  useEffect(() => {
    if (!user || isAnon) return;
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.emit('join-room', user._id);
    return () => socket.disconnect();
  }, [user, isAnon]);

  // Start watching location
  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, []);

  const stopLocationWatch = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Get one-time location
  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

  // Trigger SOS
  const triggerSOS = useCallback(async (triggeredBy = 'button') => {
    let location = currentLocation;
    if (!location) {
      try { location = await getLocation(); } catch { location = { lat: 0, lng: 0 }; }
    }

    // Anonymous mode — local only, no backend
    if (isAnon) {
      setSosActive(true);
      setSosId('local_' + Date.now());
      startLocationWatch();
      return { local: true, message: 'SOS active (local mode — add contacts to send alerts)' };
    }

    // Registered user — try backend
    try {
      const res = await api.post('/sos/trigger', {
        lat: location.lat,
        lng: location.lng,
        triggeredBy,
      });

      setSosActive(true);
      setSosId(res.data.sosId);
      startLocationWatch();

      // Browser-side EmailJS fallback — fires regardless of backend email status
      try {
        const contactsRes = await api.get('/contacts');
        const contacts = contactsRes.data.contacts || [];
        contacts.forEach((contact) => {
          if (contact.email) {
            sendSOSEmail({
              toEmail: contact.email,
              toName: contact.name,
              fromName: user?.name || 'Surakshita User',
              lat: location.lat,
              lng: location.lng,
            });
          }
        });
      } catch {}

      locationIntervalRef.current = setInterval(async () => {
        const loc = currentLocation || location;
        if (loc && res.data.sosId) {
          try {
            await api.post(`/sos/${res.data.sosId}/location`, { lat: loc.lat, lng: loc.lng });
            if (socketRef.current) {
              socketRef.current.emit('location-update', { userId: user._id, lat: loc.lat, lng: loc.lng });
            }
          } catch {}
        }
      }, 10000);

      return res.data;
    } catch (networkErr) {
      // Offline fallback — queue for background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const token = localStorage.getItem('token');
          const db = await openOfflineDB();
          await dbAdd(db, 'pending-sos', { token, data: { lat: location.lat, lng: location.lng, triggeredBy } });
          const sw = await navigator.serviceWorker.ready;
          await sw.sync.register('sos-retry');
        } catch {}
      }
      setSosActive(true);
      setSosId('offline');
      startLocationWatch();
      return { offline: true, message: 'SOS queued — will send when connection restores' };
    }
  }, [currentLocation, startLocationWatch, user, isAnon]);

  // Cancel SOS
  const cancelSOS = useCallback(async (falseAlarm = false) => {
    if (!sosId) return;

    setSosActive(false);
    setSosId(null);
    stopLocationWatch();
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    // Only call backend for real sessions
    if (!isAnon && sosId !== 'offline' && !sosId.startsWith('local_')) {
      try {
        await api.post(`/sos/${sosId}/resolve`, { falseAlarm });
      } catch {}
    }
  }, [sosId, stopLocationWatch, isAnon]);

  // Check for existing active SOS on mount — registered users only
  useEffect(() => {
    if (!user || isAnon) return;
    api.get('/sos/active').then((res) => {
      if (res.data.sos) {
        setSosActive(true);
        setSosId(res.data.sos._id);
        startLocationWatch();
      }
    }).catch(() => {});
  }, [user, isAnon, startLocationWatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationWatch();
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [stopLocationWatch]);

  return (
    <SOSContext.Provider value={{
      sosActive, sosId, currentLocation, locationError,
      triggerSOS, cancelSOS, getLocation, startLocationWatch, stopLocationWatch,
      socket: socketRef.current,
    }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => useContext(SOSContext);

// IndexedDB helpers for offline SOS queuing
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('surakshita-offline', 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore('pending-sos', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

function dbAdd(db, store, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).add(data);
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}
