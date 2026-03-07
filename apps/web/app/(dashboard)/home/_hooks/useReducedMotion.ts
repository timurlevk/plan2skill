'use client';

import { useRef, useEffect } from 'react';

// ─── Shared reduced-motion hook ──────────────────────────────
// Listens for runtime changes to prefers-reduced-motion.
// Returns a ref (not state) to avoid re-rendering on toggle.

export function useReducedMotion(): React.MutableRefObject<boolean> {
  const ref = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    ref.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => { ref.current = e.matches; };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return ref;
}
