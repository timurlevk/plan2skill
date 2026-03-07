'use client';

import React from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';

// ═══════════════════════════════════════════
// EXERCISE SHELL — Shared layout for all exercises
// Wraps exercise content with header (number, difficulty, points)
// and optional skip button
// ═══════════════════════════════════════════

interface ExerciseShellProps {
  exerciseNumber: number;
  totalExercises: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  children: React.ReactNode;
  onSkip: () => void;
  showSkip: boolean;
}

const difficultyConfig = {
  easy: { color: t.mint, labelKey: 'exercise.difficulty.easy', fallback: 'Easy' },
  medium: { color: t.gold, labelKey: 'exercise.difficulty.medium', fallback: 'Medium' },
  hard: { color: t.rose, labelKey: 'exercise.difficulty.hard', fallback: 'Hard' },
} as const;

export function ExerciseShell({
  exerciseNumber,
  totalExercises,
  difficulty,
  points,
  children,
  onSkip,
  showSkip,
}: ExerciseShellProps) {
  const tr = useI18nStore((s) => s.t);
  const config = difficultyConfig[difficulty];

  return (
    <div
      style={{
        background: t.bgCard,
        borderRadius: 16,
        border: `1.5px solid ${config.color}30`,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header row: number badge + difficulty + points */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Exercise number badge */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: `${config.color}18`,
              border: `1.5px solid ${config.color}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: t.mono,
              fontSize: 12,
              fontWeight: 700,
              color: config.color,
              flexShrink: 0,
            }}
          >
            {exerciseNumber}
          </div>

          {/* Progress text */}
          <span
            style={{
              fontFamily: t.body,
              fontSize: 12,
              color: t.textMuted,
            }}
          >
            {exerciseNumber} / {totalExercises}
          </span>

          {/* Difficulty badge */}
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              fontWeight: 600,
              color: config.color,
              background: `${config.color}14`,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {tr(config.labelKey, config.fallback)}
          </span>
        </div>

        {/* Points display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <NeonIcon type="star" size={14} color="gold" />
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 12,
              fontWeight: 700,
              color: t.gold,
            }}
          >
            {points} {tr('exercise.points', 'XP')}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1 }}>{children}</div>

      {/* Skip button */}
      {showSkip && (
        <button
          onClick={onSkip}
          style={{
            alignSelf: 'flex-end',
            background: 'transparent',
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: '6px 14px',
            fontFamily: t.body,
            fontSize: 12,
            color: t.textMuted,
            cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = t.textSecondary;
            e.currentTarget.style.borderColor = t.borderHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = t.textMuted;
            e.currentTarget.style.borderColor = t.border;
          }}
        >
          {tr('exercise.skip', 'Skip')}
        </button>
      )}
    </div>
  );
}
