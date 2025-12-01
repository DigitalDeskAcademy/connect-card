"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for persisting state in localStorage with SSR safety.
 * Returns a stateful value and a function to update it, similar to useState.
 * Value persists across page refreshes and browser sessions.
 *
 * @param key - The localStorage key to store the value under
 * @param initialValue - Default value if nothing exists in localStorage
 * @returns Tuple of [storedValue, setValue] like useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Use initialValue for SSR, then hydrate from localStorage
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Persist to localStorage whenever value changes (after hydration)
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
        return valueToStore;
      });
    },
    [key]
  );

  // Return initialValue until hydrated to prevent flash
  return [isHydrated ? storedValue : initialValue, setValue];
}
