'use client';

import React from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';

// ─── Weekly Challenges card (Phase 5E, BL-005 redesign) ──────────
// Type-specific icons, difficulty double-coding, reward preview,
// timer urgency, compact mode for sidebar.
// UX-R105 (endowed progress), UX-R141 (positive framing)

// BL-005: Challenge type → NeonIcon mapping
const CHALLENGE_ICONS: Record<string, NeonIconType> = {
  quest_count: 'lightning',
  xp_earn: 'star',
  review_count: 'book',
  streak_maintain: 'fire',
  accuracy: 'target',
  domain_variety: 'atom',
  time_spent: 'clock',
};

// BL-005: Difficulty double-coding — color + Roman numeral + border style
type DifficultyToken = { color: string; numeral: string; borderStyle: string };
const DIFFICULTY_EASY: DifficultyToken = { color: '#6EE7B7', numeral: 'Ⅰ', borderStyle: 'solid' };
const DIFFICULTY: Record<string, DifficultyToken> = {
  easy: DIFFICULTY_EASY,
  medium: { color: '#3B82F6', numeral: 'Ⅱ', borderStyle: 'dashed' },
  hard:   { color: '#9D7AFF', numeral: 'Ⅲ', borderStyle: 'double' },
};

// BL-005: Timer urgency colors (UX-R103: no guilt, UX-R141: positive framing)
function getTimerStyle(hoursLeft: number): { color: string; animate: boolean } {
  if (hoursLeft < 1) return { color: '#FF6B8A', animate: true };
  if (hoursLeft < 24) return { color: '#FF6B8A', animate: false };
  if (hoursLeft < 72) return { color: '#FFD166', animate: false };
  return { color: '#71717A', animate: false };
}

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
  compact?: boolean; // BL-005: true in sidebar, false in main
  style?: React.CSSProperties;
}

export function WeeklyChallenges({ challenges, weekEnd, compact = false, style }: WeeklyChallengesProps) {
  if (challenges.length === 0) return null;

  const endDate = new Date(weekEnd);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 3600000));
  const daysLeft = Math.floor(hoursLeft / 24);
  const timeLabel = daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`;
  const timerStyle = getTimerStyle(hoursLeft);

  // Compact mode — sidebar (BL-004)
  if (compact) {
    return (
      <div
        style={{
          padding: 14,
          borderRadius: 16,
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          ...style,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <NeonIcon type="target" size={14} color="violet" />
          <span style={{
            fontFamily: t.display, fontSize: 10, fontWeight: 700,
            color: t.textSecondary, textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', flex: 1,
          }}>
            Weekly Quests
          </span>
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: timerStyle.color,
            animation: timerStyle.animate ? 'pulse 2s ease-in-out infinite' : 'none',
          }}>
            {timeLabel} ↻
          </span>
        </div>
        {/* Compact rows — single line per challenge */}
        {challenges.map((c) => {
          const diff = DIFFICULTY[c.difficulty] ?? DIFFICULTY_EASY;
          const icon = CHALLENGE_ICONS[c.type] ?? 'target';
          const nearComplete = c.progress >= 0.8 && !c.completed;
          const pct = Math.min(100, c.progress * 100);
          return (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 0',
              opacity: c.completed ? 0.6 : 1,
            }}>
              <NeonIcon type={c.completed ? 'check' : icon} size={12} color={c.completed ? 'cyan' : diff.color} />
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                color: c.completed ? t.cyan : t.textMuted, minWidth: 38,
              }}>
                {c.currentValue}/{c.targetValue}
              </span>
              {/* Mini progress bar */}
              <div
                role="progressbar"
                aria-valuenow={c.currentValue}
                aria-valuemax={c.targetValue}
                aria-label={`${c.title}: ${c.currentValue} of ${c.targetValue}`}
                style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: '#252530', overflow: 'hidden',
                }}
              >
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 2,
                  background: c.completed ? t.cyan : diff.color,
                  transition: 'width 0.6s ease-out',
                  boxShadow: nearComplete ? `0 0 6px ${diff.color}60` : 'none',
                }} />
              </div>
              {/* Tier numeral */}
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 800,
                color: diff.color, minWidth: 12, textAlign: 'center' as const,
              }}>
                {diff.numeral}
              </span>
              {/* Reward */}
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                color: c.completed ? t.cyan : t.gold,
              }}>
                +{c.xpReward}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full mode — main content / inline fallback
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        marginBottom: 24,
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <NeonIcon type="target" size={16} color="violet" />
        <span style={{
          fontFamily: t.display, fontSize: 11, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase' as const,
          letterSpacing: '0.06em', flex: 1,
        }}>
          Weekly Quests
        </span>
        <span style={{
          fontFamily: t.mono, fontSize: 10,
          color: timerStyle.color,
          animation: timerStyle.animate ? 'pulse 2s ease-in-out infinite' : 'none',
        }}>
          {timeLabel} ↻
        </span>
      </div>

      {/* Challenges */}
      {challenges.map((c, idx) => {
        const diff = DIFFICULTY[c.difficulty] ?? DIFFICULTY_EASY;
        const icon = CHALLENGE_ICONS[c.type] ?? 'target';
        const nearComplete = c.progress >= 0.8 && !c.completed;
        const pct = Math.min(100, c.progress * 100);
        return (
          <div key={c.id}>
            {/* Divider between challenges (not before first) */}
            {idx > 0 && (
              <div style={{ height: 1, background: t.border, margin: '6px 0' }} />
            )}
            <div style={{ padding: '8px 0' }}>
              {/* Title row: icon + title + tier badge + fraction */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              }}>
                <NeonIcon
                  type={c.completed ? 'check' : icon}
                  size={14}
                  color={c.completed ? 'cyan' : diff.color}
                />
                <span style={{
                  fontFamily: t.body, fontSize: 13, fontWeight: 600,
                  color: c.completed ? t.cyan : t.text, flex: 1,
                }}>
                  {c.completed ? '✓ ' : ''}{c.title}
                </span>
                {/* Difficulty double-coded: color + numeral + border */}
                <span
                  aria-label={`Difficulty: ${c.difficulty}`}
                  style={{
                    fontFamily: t.mono, fontSize: 9, fontWeight: 800,
                    color: diff.color,
                    padding: '1px 6px', borderRadius: 6,
                    border: `1.5px ${diff.borderStyle} ${diff.color}50`,
                    background: `${diff.color}08`,
                  }}
                >
                  {diff.numeral}
                </span>
              </div>

              {/* Progress bar + fraction */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div
                  role="progressbar"
                  aria-valuenow={c.currentValue}
                  aria-valuemax={c.targetValue}
                  aria-label={`${c.title}: ${c.currentValue} of ${c.targetValue}`}
                  style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: '#252530', overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 2,
                    background: c.completed
                      ? t.cyan
                      : `linear-gradient(90deg, ${diff.color}, ${diff.color}CC)`,
                    transition: 'width 0.6s ease-out',
                    boxShadow: nearComplete ? `0 0 8px ${diff.color}60` : 'none',
                    animation: nearComplete ? 'glowPulse 2s ease-in-out infinite' : 'none',
                  }} />
                </div>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: c.completed ? t.cyan : t.textMuted, minWidth: 40,
                  textAlign: 'right' as const,
                }}>
                  {c.currentValue}/{c.targetValue}
                </span>
              </div>

              {/* Reward preview — always visible (BL-005) */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              }}>
                <span style={{ color: c.completed ? t.cyan : t.gold }}>
                  +{c.xpReward} XP
                </span>
                {c.coinReward > 0 && (
                  <span style={{ color: c.completed ? t.cyan : t.gold }}>
                    🪙 {c.coinReward}
                  </span>
                )}
                {c.completed && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 9,
                    color: t.cyan, fontWeight: 700,
                  }}>
                    Claimed
                  </span>
                )}
                {!c.completed && c.currentValue === 0 && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 9,
                    color: t.textMuted, fontStyle: 'italic' as const,
                  }}>
                    Start any quest to begin!
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
