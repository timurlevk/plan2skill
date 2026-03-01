'use client';

import React from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// XP FLOAT — animated +XP indicator
// Micro animation tier (150-400ms visible)
// ═══════════════════════════════════════════

export function XPFloat({ amount, show }: { amount: number; show: boolean }) {
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
      animation: 'xpFloat 1.2s ease-out forwards',
      textShadow: `0 0 10px ${t.gold}60`,
      pointerEvents: 'none',
    }}>
      +{amount} XP
    </div>
  );
}
