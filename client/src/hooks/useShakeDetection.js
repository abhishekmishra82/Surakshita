import { useEffect, useRef, useCallback } from 'react';

const useShakeDetection = ({ threshold = 25, onShake, enabled = true }) => {
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const lastShake = useRef(0);
  const COOLDOWN = 3000; // 3 seconds between shakes

  const handleMotion = useCallback((event) => {
    if (!enabled) return;
    const { x, y, z } = event.accelerationIncludingGravity || {};
    if (x == null) return;

    const delta =
      Math.abs(x - lastAccel.current.x) +
      Math.abs(y - lastAccel.current.y) +
      Math.abs(z - lastAccel.current.z);

    lastAccel.current = { x, y, z };

    const now = Date.now();
    if (delta > threshold && now - lastShake.current > COOLDOWN) {
      lastShake.current = now;
      onShake?.();
    }
  }, [threshold, onShake, enabled]);

  useEffect(() => {
    if (!enabled || !window.DeviceMotionEvent) return;

    // iOS 13+ requires permission
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((perm) => {
          if (perm === 'granted') window.addEventListener('devicemotion', handleMotion);
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [handleMotion, enabled]);
};

export default useShakeDetection;
