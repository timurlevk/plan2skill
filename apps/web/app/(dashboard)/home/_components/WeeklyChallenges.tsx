'use client';

import React from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';

// ─── Weekly Challenges card (Phase 5E) ──────────────────────────
// Shows 3 weekly goals with progress bars. Resets every Monday.

const t = {
  display: '"Plus Jakarta Sans", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  bgCard: '#18181F',
  bgElevated: '#121218',
  border: '#252530',
  violet: '#9D7AFF',
  cyan: '#4ECDC4',
  gold: '#FFD166',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#6EE7B7',
  medium: '#3B82F6',
  hard: '#9D7AFF',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Tier I',
  medium: 'Tier II',
  hard: 'Tier III',
};

interface Challenge {
  id: string;
  type: string;
  difficulty: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  coinReward: number;
}

interface WeeklyChallengesProps {
  challenges: Challenge[];
  weekEnd: string;
  style?: React.CSSProperties;
}

export function WeeklyChallenges({ challenges, weekEnd, style }: WeeklyChallengesProps) {
  if (challenges.length === 0) return null;

  const endDate = new Date(weekEnd);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 3600000));
  const daysLeft = Math.floor(hoursLeft / 24);
  const timeLabel = daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`;

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        marginBottom: 24,
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <NeonIcon type="target" size={16} color="violet" />
        <span
          style={{
            fontFamily: t.display,
            fontSize: 11,
            fontWeight: 700,
            color: t.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flex: 1,
          }}
        >
          Weekly Quests
        </span>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.textMuted,
          }}
        >
          Resets in {timeLabel}
        </span>
      </div>

      {/* Challenges */}
      {challenges.map((c) => {
        const color = DIFFICULTY_COLORS[c.difficulty] ?? t.violet;
        const label = DIFFICULTY_LABELS[c.difficulty] ?? c.difficulty;
        return (
          <div
            key={c.id}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: t.bgElevated,
              border: `1px solid ${c.completed ? `${color}40` : t.border}`,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.completed && <NeonIcon type="check" size={12} color="cyan" />}
                <span
                  style={{
                    fontFamily: t.body,
                    fontSize: 13,
                    fontWeight: 600,
                    color: c.completed ? t.cyan : t.text,
                    textDecoration: c.completed ? 'line-through' : 'none',
                    opacity: c.completed ? 0.7 : 1,
                  }}
                >
                  {c.title}
                </span>
              </div>
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  color,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: '#252530',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, c.progress * 100)}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: c.completed
                      ? t.cyan
                      : `linear-gradient(90deg, ${color}, ${color}CC)`,
                    transition: 'width 0.6s ease-out',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.completed ? t.cyan : t.textMuted,
                  minWidth: 45,
                  textAlign: 'right',
                }}
              >
                {c.currentValue}/{c.targetValue}
              </span>
            </div>

            {/* Rewards */}
            {c.completed && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 6,
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: t.gold,
                }}
              >
                <span>+{c.xpReward} XP</span>
                <span>+{c.coinReward} Coins</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
