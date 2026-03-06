'use client';

import React, { useState, useEffect } from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// XP FLOAT — animated +XP indicator
// Micro animation tier (150-400ms visible)
// ═══════════════════════════════════════════

export function XPFloat({ amount, show }: { amount: number; show: boolean }) {
  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!show) return null;
  return (
    <div style={{
      position: 'absolute',
      top: -10,
      right: 20,
      fontFamily: t.mono,
      fontSize: 18,
      fontWeight: 800,
      color: t.gold,
      animation: reducedMotion ? 'none' : 'xpFloat 1.2s ease-out forwards',
      opacity: reducedMotion ? 1 : undefined,
      textShadow: `0 0 10px ${t.gold}60`,
      pointerEvents: 'none',
    }}>
      +{amount} XP
    </div>
  );
}
