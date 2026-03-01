'use client';

import React from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// CONFETTI PARTICLE — celebration effect
// Meso animation tier (400-1200ms)
// ═══════════════════════════════════════════

const CONFETTI_COLORS = [t.violet, t.cyan, t.rose, t.gold, t.mint, t.indigo];

export function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = 5 + Math.random() * 90;
  const delay = Math.random() * 1.5;
  const size = 4 + Math.random() * 6;
  const isSquare = index % 3 === 0;

  return (
    <div style={{
      position: 'absolute',
      width: size,
      height: isSquare ? size : size * 0.4,
      borderRadius: isSquare ? 1 : size,
      background: color,
      top: -10,
      left: `${left}%`,
      animation: `confettiFall 2.5s ease-out ${delay}s both`,
      opacity: 0.9,
    }} />
  );
}

export function ConfettiLayer({ count = 30 }: { count?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: count }, (_, i) => (
        <ConfettiParticle key={i} index={i} />
      ))}
    </div>
  );
}
