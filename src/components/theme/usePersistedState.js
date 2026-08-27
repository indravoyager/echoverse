import { useState, useEffect } from 'react';

export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof initialValue === 'object' && initialValue !== null) {
          return { ...initialValue, ...parsed };
        }
        return parsed;
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to write key "${key}" to localStorage:`, e);
    }
  }, [key, state]);

  return [state, setState];
}
