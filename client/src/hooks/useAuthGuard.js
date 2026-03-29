import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Returns:
 *   requireAuth(fn, featureLabel) — wraps an action; shows login prompt if not authed
 *   AuthPromptComponent           — render this anywhere in your JSX
 */
const useAuthGuard = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(null); // { resolve, featureLabel }

  const requireAuth = useCallback((fn, featureLabel = 'use this feature') => {
    return (...args) => {
      if (user) {
        return fn(...args);
      }
      // Return a promise that resolves after login
      return new Promise((resolve) => {
        setPrompt({ resolve, featureLabel });
      }).then(() => fn(...args));
    };
  }, [user]);

  const handleSuccess = useCallback(() => {
    if (prompt?.resolve) prompt.resolve();
    setPrompt(null);
  }, [prompt]);

  const handleClose = useCallback(() => {
    setPrompt(null);
  }, []);

  return { requireAuth, prompt, handleSuccess, handleClose };
};

export default useAuthGuard;
