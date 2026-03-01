'use client';

import React from 'react';
import { useOnboardingStore } from '@plan2skill/store';
import { XPBar } from './XPBar';

// ═══════════════════════════════════════════
// STEP BAR — 5-step progress indicator
// Gradient fill for completed steps
// + XP bar below step dots
// ═══════════════════════════════════════════

const STEP_LABELS = ['Goals', 'Skills', 'Archetype', 'Forge', 'Roadmap'];

export function StepBar({ current, total = 5 }: { current: number; total?: number }) {
  const { xpTotal, level } = useOnboardingStore();

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: i < current
              ? 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)'
              : i === current
                ? 'rgba(157,122,255,0.3)'
                : '#252530',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        {STEP_LABELS.slice(0, total).map((label, i) => (
          <span key={label} style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: i < current ? 600 : 400,
            color: i < current ? '#A1A1AA' : i === current ? '#9D7AFF' : '#71717A',
            transition: 'color 0.3s ease',
          }}>
            {label}
          </span>
        ))}
      </div>
      {/* XP Bar */}
      <XPBar xp={xpTotal} level={level} />
    </div>
  );
}
