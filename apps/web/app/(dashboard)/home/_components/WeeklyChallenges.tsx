'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { useReducedMotion } from '../_hooks/useReducedMotion';
import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';

// ─── Weekly Challenges card (Phase 5E, BL-005 redesign) ──────────
// Type-specific icons, descriptions, difficulty double-coding, reward preview,
// timer urgency, compact + full modes, clickable → /league?tab=weekly,
// Weekly Champion bonus banner.
// UX-R105 (endowed progress), UX-R141 (positive framing), UX-R103 (no urgency guilt)

// BL-005: Challenge type → NeonIcon mapping
const CHALLENGE_ICONS: Record<string, NeonIconType> = {
  quest_count: 'lightning',
  quest_volume: 'lightning',
  xp_earn: 'star',
  xp_target: 'star',
  review_count: 'book',
  review_sprint: 'book',
  streak_maintain: 'fire',
  streak_guard: 'fire',
  accuracy: 'target',
  domain_variety: 'atom',
  domain_focus: 'atom',
  time_spent: 'clock',
  perfect_day: 'star',
  mastery_push: 'shield',
};

// Challenge type → human-readable description
const CHALLENGE_DESCRIPTIONS: Record<string, (n: number, tr: (key: string, fallback?: string) => string, domain?: string) => string> = {
  quest_count: (n, tr) => tr('weekly.challenge_complete_quests', 'Complete {n} quests').replace('{n}', String(n)),
  quest_volume: (n, tr) => tr('weekly.challenge_complete_quests', 'Complete {n} quests').replace('{n}', String(n)),
  xp_earn: (n, tr) => tr('weekly.challenge_earn_xp', 'Earn {n} XP').replace('{n}', String(n)),
  xp_target: (n, tr) => tr('weekly.challenge_earn_xp', 'Earn {n} XP').replace('{n}', String(n)),
  review_count: (n, tr) => tr('weekly.challenge_review_skills', 'Review {n} skills').replace('{n}', String(n)),
  review_sprint: (n, tr) => tr('weekly.challenge_review_skills', 'Review {n} skills').replace('{n}', String(n)),
  streak_maintain: (_n, tr) => tr('weekly.challenge_keep_streak', 'Keep your streak all week'),
  streak_guard: (_n, tr) => tr('weekly.challenge_keep_streak', 'Keep your streak all week'),
  accuracy: (n, tr) => tr('weekly.challenge_score_accuracy', 'Score {n}%+ accuracy').replace('{n}', String(n)),
  domain_variety: (n, tr) => tr('weekly.challenge_quest_domains', 'Quest in {n} domains').replace('{n}', String(n)),
  domain_focus: (n, tr, d) => tr('weekly.challenge_domain_focus', 'Complete {n} {domain} quests').replace('{n}', String(n)).replace('{domain}', d ?? ''),
  time_spent: (n, tr) => tr('weekly.challenge_train_minutes', 'Train for {n} minutes').replace('{n}', String(n)),
  perfect_day: (n, tr) => tr('weekly.challenge_perfect_days', 'Have {n} Perfect Day(s)').replace('{n}', String(n)),
  mastery_push: (n, tr) => tr('weekly.challenge_level_skills', 'Level up {n} skill(s)').replace('{n}', String(n)),
};

// Challenge type → contextual hint for expanded view
const CHALLENGE_HINTS: Record<string, string> = {
  quest_count: 'weekly.hint_quests',
  quest_volume: 'weekly.hint_quests',
  xp_earn: 'weekly.hint_xp',
  xp_target: 'weekly.hint_xp',
  review_count: 'weekly.hint_review',
  review_sprint: 'weekly.hint_review',
  streak_maintain: 'weekly.hint_streak',
  streak_guard: 'weekly.hint_streak',
  accuracy: 'weekly.hint_accuracy',
  domain_variety: 'weekly.hint_domains',
  domain_focus: 'weekly.hint_domain_focus',
  time_spent: 'weekly.hint_time',
  perfect_day: 'weekly.hint_perfect',
  mastery_push: 'weekly.hint_mastery',
};

function getChallengeDescription(type: string, target: number, tr: (key: string, fallback?: string) => string, domain?: string): string {
  const fn = CHALLENGE_DESCRIPTIONS[type];
  return fn ? fn(target, tr, domain) : tr('weekly.challenge_default', 'Complete {n} tasks').replace('{n}', String(target));
}

// BL-005: Difficulty double-coding — color + Roman numeral + border style
type DifficultyToken = { color: string; numeral: string; borderStyle: string };
const DIFFICULTY_EASY: DifficultyToken = { color: t.mint, numeral: 'Ⅰ', borderStyle: 'solid' };
const DIFFICULTY: Record<string, DifficultyToken> = {
  easy: DIFFICULTY_EASY,
  medium: { color: t.indigo, numeral: 'Ⅱ', borderStyle: 'dashed' },
  hard:   { color: t.violet, numeral: 'Ⅲ', borderStyle: 'double' },
};

// BL-005: Timer urgency colors (UX-R103: no guilt, UX-R141: positive framing)
function getTimerStyle(hoursLeft: number): { color: string; animate: boolean } {
  if (hoursLeft < 1) return { color: t.rose, animate: true };
  if (hoursLeft < 24) return { color: t.rose, animate: false };
  if (hoursLeft < 72) return { color: t.gold, animate: false };
  return { color: t.textMuted, animate: false };
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
  allCompleted?: boolean;
  bonusClaimed?: boolean;
  compact?: boolean; // BL-005: true in sidebar, false in main
  style?: React.CSSProperties;
}

export function WeeklyChallenges({
  challenges, weekEnd, allCompleted = false, bonusClaimed = false,
  compact = false, style,
}: WeeklyChallengesProps) {
  const router = useRouter();
  const tr = useI18nStore((s) => s.t);

  // Track recently completed challenges for celebration flash
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  // MA-LL002: init ref as null, not store value — avoids hydration false-positive
  const prevCompletedRef = useRef<Set<string> | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced.current) return;
    const nowCompleted = new Set(challenges.filter(c => c.completed).map(c => c.id));
    // Skip first render (ref is null)
    if (prevCompletedRef.current !== null) {
      const prev = prevCompletedRef.current;
      for (const id of Array.from(nowCompleted)) {
        if (!prev.has(id)) {
          setCelebratingId(id);
          // MA-LL006: store timer in ref + cleanup
          if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
          celebrationTimerRef.current = setTimeout(() => setCelebratingId(null), 300);
          break;
        }
      }
    }
    prevCompletedRef.current = nowCompleted;
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, [challenges]);

  // Hover states for clickable rows
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredHeader, setHoveredHeader] = useState(false);

  if (challenges.length === 0) return null;

  const endDate = new Date(weekEnd);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 3600000));
  const daysLeft = Math.floor(hoursLeft / 24);
  const timeLabel = daysLeft > 0
    ? tr('weekly.time_days', '{d}d {h}h').replace('{d}', String(daysLeft)).replace('{h}', String(hoursLeft % 24))
    : tr('weekly.time_hours', '{h}h').replace('{h}', String(hoursLeft));
  const timerStyle = getTimerStyle(hoursLeft);
  const completedCount = challenges.filter(c => c.completed).length;

  const navigateToWeekly = () => router.push('/league?tab=weekly');

  // ─── Compact mode — sidebar (BL-004 + descriptions + clickable) ───
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
        {/* Header — clickable */}
        <div
          onClick={navigateToWeekly}
          onMouseEnter={() => setHoveredHeader(true)}
          onMouseLeave={() => setHoveredHeader(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            cursor: 'pointer',
          }}
        >
          <NeonIcon type="target" size={14} color="violet" />
          <span style={{
            fontFamily: t.display, fontSize: 10, fontWeight: 700,
            color: t.textSecondary, textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', flex: 1,
          }}>
            {tr('weekly.title', 'Weekly Quests')}
          </span>
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: timerStyle.color,
            animation: timerStyle.animate ? 'pulse 2s ease-in-out infinite' : 'none',
          }}>
            {timeLabel} ↻
          </span>
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: hoveredHeader ? t.violet : t.textMuted,
            transition: 'color 0.15s ease',
          }}>
            →
          </span>
        </div>

        {/* Compact rows — description instead of raw numbers, clickable */}
        {challenges.map((c) => {
          const diff = DIFFICULTY[c.difficulty] ?? DIFFICULTY_EASY;
          const icon = CHALLENGE_ICONS[c.type] ?? 'target';
          const nearComplete = c.progress >= 0.8 && !c.completed;
          const pct = Math.min(100, c.progress * 100);
          const desc = getChallengeDescription(c.type, c.targetValue, tr);
          const isHovered = hoveredRow === c.id;
          return (
            <div
              key={c.id}
              onClick={navigateToWeekly}
              onMouseEnter={() => setHoveredRow(c.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 0',
                opacity: c.completed ? 0.6 : 1,
                cursor: 'pointer',
                background: isHovered ? `${t.violet}06` : 'transparent',
                borderRadius: 6,
                transition: 'background 0.15s ease',
              }}
            >
              <NeonIcon type={c.completed ? 'check' : icon} size={12} color={c.completed ? 'cyan' : diff.color} />
              <span style={{
                fontFamily: t.body, fontSize: 10, fontWeight: 600,
                color: c.completed ? t.cyan : t.text,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}>
                {c.completed ? '✓ ' : ''}{desc}
              </span>
              {/* Mini progress bar */}
              <div
                role="progressbar"
                aria-valuenow={c.currentValue}
                aria-valuemax={c.targetValue}
                aria-label={tr('weekly.aria_progress', '{desc}: {current} of {target}').replace('{desc}', desc).replace('{current}', String(c.currentValue)).replace('{target}', String(c.targetValue))}
                style={{
                  width: 40, height: 4, borderRadius: 2,
                  background: t.border, overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: '100%', height: '100%', borderRadius: 2,
                  background: c.completed ? t.cyan : diff.color,
                  transform: `scaleX(${pct / 100})`,
                  transformOrigin: 'left',
                  transition: 'transform 0.6s ease-out',
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
                {tr('weekly.xp_reward', '+{n} XP').replace('{n}', String(c.xpReward))}
              </span>
            </div>
          );
        })}

        {/* Weekly Champion compact banner */}
        <div
          onClick={navigateToWeekly}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 8, padding: '6px 0',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 11 }}>
            {allCompleted ? '🏆' : '🏆'}
          </span>
          <span style={{
            fontFamily: t.mono, fontSize: 9, fontWeight: 700,
            color: allCompleted ? t.gold : t.textMuted,
            flex: 1,
          }}>
            {allCompleted
              ? (bonusClaimed ? tr('weekly.champion_compact_claimed', 'Weekly Champion! +150 XP claimed') : tr('weekly.champion_compact_unclaimed', 'Weekly Champion! +150 XP + 🪙 50'))
              : tr('weekly.bonus_hint', 'Complete all 3 → +150 XP bonus')}
          </span>
        </div>
      </div>
    );
  }

  // ─── Full mode — main content with descriptions + hints + champion banner ───
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
      {/* Header — clickable */}
      <div
        onClick={navigateToWeekly}
        onMouseEnter={() => setHoveredHeader(true)}
        onMouseLeave={() => setHoveredHeader(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          cursor: 'pointer',
        }}
      >
        <NeonIcon type="target" size={16} color="violet" />
        <span style={{
          fontFamily: t.display, fontSize: 11, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase' as const,
          letterSpacing: '0.06em', flex: 1,
        }}>
          {tr('weekly.title', 'Weekly Quests')}
        </span>
        <span style={{
          fontFamily: t.mono, fontSize: 10,
          color: timerStyle.color,
          animation: timerStyle.animate ? 'pulse 2s ease-in-out infinite' : 'none',
        }}>
          {timeLabel} ↻
        </span>
        <span style={{
          fontFamily: t.mono, fontSize: 10, color: hoveredHeader ? t.violet : t.textMuted,
          transition: 'color 0.15s ease',
        }}>
          →
        </span>
      </div>

      {/* Challenges */}
      {challenges.map((c, idx) => {
        const diff = DIFFICULTY[c.difficulty] ?? DIFFICULTY_EASY;
        const icon = CHALLENGE_ICONS[c.type] ?? 'target';
        const nearComplete = c.progress >= 0.8 && !c.completed;
        const pct = Math.min(100, c.progress * 100);
        const isCelebrating = celebratingId === c.id;
        const desc = getChallengeDescription(c.type, c.targetValue, tr);
        const hint = CHALLENGE_HINTS[c.type] ?? '';
        const isHovered = hoveredRow === c.id;
        return (
          <div
            key={c.id}
            onClick={navigateToWeekly}
            onMouseEnter={() => setHoveredRow(c.id)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              cursor: 'pointer',
              borderRadius: 10,
              background: isHovered ? `${t.violet}06` : 'transparent',
              transition: 'background 0.15s ease',
              // MA-LL003: fadeUp with both + hover transform conflict → wrapper pattern.
              // Animation on outer div, hover bg on same div (no transform), safe.
              animation: prefersReduced.current ? 'none' : `fadeUp 0.3s ease-out ${idx * 0.08}s both`,
            }}
          >
            {/* Divider between challenges (not before first) */}
            {idx > 0 && (
              <div style={{ height: 1, background: t.border, margin: '2px 0' }} />
            )}
            <div style={{ padding: '8px 4px' }}>
              {/* Title row: icon + description + tier badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
              }}>
                <span style={{
                  display: 'inline-flex',
                  animation: isCelebrating ? 'bounceIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                }}>
                  <NeonIcon
                    type={c.completed ? 'check' : icon}
                    size={14}
                    color={c.completed ? 'cyan' : diff.color}
                  />
                </span>
                <span style={{
                  fontFamily: t.body, fontSize: 13, fontWeight: 600,
                  color: c.completed ? t.cyan : t.text, flex: 1,
                }}>
                  {c.completed ? '✓ ' : ''}{desc}
                </span>
                {/* Difficulty double-coded: color + numeral + border */}
                <span
                  aria-label={tr('weekly.aria_difficulty', 'Difficulty: {level}').replace('{level}', c.difficulty)}
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

              {/* Hint — contextual description */}
              {hint && !c.completed && (
                <div style={{
                  fontFamily: t.body, fontSize: 11, color: t.textMuted,
                  marginBottom: 6, paddingLeft: 22,
                  fontStyle: 'italic' as const,
                }}>
                  {tr(hint, hint)}
                </div>
              )}

              {/* Progress bar + fraction + percentage */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div
                  role="progressbar"
                  aria-valuenow={c.currentValue}
                  aria-valuemax={c.targetValue}
                  aria-label={tr('weekly.aria_progress', '{desc}: {current} of {target}').replace('{desc}', desc).replace('{current}', String(c.currentValue)).replace('{target}', String(c.targetValue))}
                  style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: t.border, overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: '100%', height: '100%', borderRadius: 2,
                    background: c.completed
                      ? t.cyan
                      : `linear-gradient(90deg, ${diff.color}, ${diff.color}CC)`,
                    transform: `scaleX(${pct / 100})`,
                    transformOrigin: 'left',
                    transition: 'transform 0.6s ease-out',
                    boxShadow: isCelebrating
                      ? `0 0 8px rgba(78,205,196,0.5)`
                      : (nearComplete ? `0 0 8px ${diff.color}60` : 'none'),
                    // MA-LL001: glowPulse only on small elements (<100px). Progress bar is narrow (4px), safe.
                    animation: nearComplete ? 'glowPulse 8s ease-in-out infinite' : 'none',
                  }} />
                </div>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: c.completed ? t.cyan : t.textMuted, minWidth: 56,
                  textAlign: 'right' as const,
                }}>
                  {c.currentValue}/{c.targetValue} ({Math.round(pct)}%)
                </span>
              </div>

              {/* Reward preview — always visible (BL-005) */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              }}>
                <span style={{ color: c.completed ? t.cyan : t.gold }}>
                  {tr('weekly.xp_reward', '+{n} XP').replace('{n}', String(c.xpReward))}
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
                    {tr('weekly.claimed', 'Claimed')}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ─── Weekly Champion banner ─── */}
      <div style={{
        marginTop: 10, padding: '10px 12px',
        borderRadius: 12,
        background: allCompleted ? `${t.gold}10` : t.bgElevated,
        border: `1px solid ${allCompleted ? `${t.gold}30` : t.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}
        onClick={navigateToWeekly}
      >
        <span style={{ fontSize: 16 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: t.display, fontSize: 11, fontWeight: 700,
            color: allCompleted ? t.gold : t.text,
          }}>
            {allCompleted
              ? (bonusClaimed ? tr('weekly.champion_claimed', 'Weekly Champion! Bonus claimed') : tr('weekly.champion_unclaimed', 'Weekly Champion!'))
              : tr('weekly.champion', 'Weekly Champion')}
          </div>
          <div style={{
            fontFamily: t.mono, fontSize: 10,
            color: allCompleted ? t.gold : t.textMuted,
          }}>
            {allCompleted
              ? tr('weekly.champion_reward', '+150 XP + 🪙 50')
              : tr('weekly.champion_progress', '{n}/3 completed → +150 XP + 🪙 50 bonus').replace('{n}', String(completedCount))}
          </div>
        </div>
        {allCompleted && (
          <NeonIcon type="check" size={14} color="gold" />
        )}
      </div>
    </div>
  );
}
