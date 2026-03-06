'use client';

import React from 'react';
import { useOnboardingV2Store } from '@plan2skill/store';
import { XPBar } from './XPBar';
import { t } from './tokens';

// ═══════════════════════════════════════════
// STEP BAR v2 — Dynamic dot progress for onboarding v2
// Intent-based: 3 steps (full flow) or 2 steps (exploring)
// ═══════════════════════════════════════════

const FULL_LABELS = ['Intent', 'Goal', 'Hero'];
const EXPLORING_LABELS = ['Intent', 'Ready!'];

interface StepBarV2Props {
  /** 0-indexed current step */
  current: number;
}

export function StepBarV2({ current }: StepBarV2Props) {
  const { xpTotal, level, intent } = useOnboardingV2Store();
  const isExploring = intent === 'exploring';
  const labels = isExploring ? EXPLORING_LABELS : FULL_LABELS;
  const total = labels.length;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: i < current
              ? t.gradient
              : i === current
                ? `${t.violet}4D` // 30% opacity
                : t.border,
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Step labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        {labels.map((label, i) => (
          <span key={label} style={{
            fontFamily: t.body,
            fontSize: 10,
            fontWeight: i < current ? 600 : 400,
            color: i < current
              ? t.textSecondary
              : i === current
                ? t.violet
                : t.textMuted,
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
