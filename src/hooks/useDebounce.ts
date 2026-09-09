'use client';

import { useState, useEffect } from 'react';

/**
 * Module 5 - Task 2: 300ms Debounce Hook (Performance Throttling Engine)
 *
 * Prevents unnecessary API calls and database load by delaying state updates
 * until the user has stopped typing for the specified duration (default: 300ms).
 *
 * @param value The value to debounce (e.g. search query string)
 * @param delay Milliseconds to wait before updating (default 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update debouncedValue after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timer if value changes (user is still actively typing)
    // or if the component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
