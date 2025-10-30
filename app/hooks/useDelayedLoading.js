import { useState, useEffect } from 'react';

/**
 * Hook to simulate delayed loading for testing skeleton components
 * 
 * Usage:
 *   const { loading, data } = useDelayedLoading(actualData, { delay: 2000 });
 * 
 * In production, set delay to 0 or remove the hook entirely
 */
export function useDelayedLoading(actualData, options = {}) {
  const { delay = 0, enabled = true } = options;
  const [loading, setLoading] = useState(enabled && delay > 0);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!enabled || delay === 0) {
      setData(actualData);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      setData(actualData);
      setLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [actualData, delay, enabled]);

  return { loading, data };
}

/**
 * Wrapper component to add delay to any loading state
 * Useful for testing in development
 */
export function withDelayedLoading(Component, delay = 2000) {
  return function DelayedComponent(props) {
    const { loading, ...rest } = props;
    const [delayedLoading, setDelayedLoading] = useState(loading);

    useEffect(() => {
      if (loading) {
        setDelayedLoading(true);
        const timer = setTimeout(() => {
          setDelayedLoading(false);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setDelayedLoading(false);
      }
    }, [loading, delay]);

    return <Component {...rest} loading={delayedLoading} />;
  };
}

