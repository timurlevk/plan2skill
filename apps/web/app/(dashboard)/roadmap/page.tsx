'use client';

import React, { useState, useMemo } from 'react';
import { useOnboardingStore } from '@plan2skill/store';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity, skillLevelRarity } from '../../(onboarding)/_components/tokens';
import { GOALS } from '../../(onboarding)/_data/goals';

// ═══════════════════════════════════════════
// QUEST LOG — Roadmap page with goal tabs + vertical timeline
// RPG vocabulary: milestones → phases, tasks → quests
// ═══════════════════════════════════════════

const PHASES = [
  {
    title: 'Foundations & Setup',
    desc: 'Build your base knowledge and set up your environment',
    rarity: 'common' as const, icon: 'book' as const, taskCount: 12,
  },
  {
    title: 'Core Concepts',
    desc: 'Master the fundamental skills and core patterns',
    rarity: 'uncommon' as const, icon: 'code' as const, taskCount: 15,
  },
  {
    title: 'Practical Projects',
    desc: 'Apply your knowledge through hands-on building',
    rarity: 'rare' as const, icon: 'rocket' as const, taskCount: 14,
  },
  {
    title: 'Advanced Patterns',
    desc: 'Level up with advanced techniques and edge cases',
    rarity: 'epic' as const, icon: 'sparkle' as const, taskCount: 13,
  },
  {
    title: 'Capstone Challenge',
    desc: 'Prove your mastery with a final boss challenge',
    rarity: 'legendary' as const, icon: 'crown' as const, taskCount: 5,
  },
];

function distributeWeeks(totalWeeks: number) {
  // Distribute weeks across 5 phases proportionally
  const proportions = [0.15, 0.2, 0.3, 0.2, 0.15];
  let start = 1;
  return proportions.map((p) => {
    const weeks = Math.max(1, Math.round(totalWeeks * p));
    const end = Math.min(start + weeks - 1, totalWeeks);
    const range = start === end ? `W${start}` : `W${start}-W${end}`;
    start = end + 1;
    return range;
  });
}

export default function QuestLogPage() {
  const { selectedGoals, skillAssessments, dailyMinutes, aiEstimateWeeks } = useOnboardingStore();
  const [activeGoalIdx, setActiveGoalIdx] = useState(0);

  const activeGoal = selectedGoals[activeGoalIdx];
  const activeGoalData = activeGoal ? GOALS.find(g => g.id === activeGoal.id) : null;
  const assessment = activeGoal ? skillAssessments.find(a => a.goalId === activeGoal.id) : null;
  const levelRarity = assessment ? skillLevelRarity[assessment.level as keyof typeof skillLevelRarity] : rarity.common;

  const totalWeeks = activeGoalData?.estimatedWeeks || aiEstimateWeeks || 12;
  const weekRanges = useMemo(() => distributeWeeks(totalWeeks), [totalWeeks]);

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* ─── Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="map" size={24} color="cyan" />
        Quest Log
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        marginBottom: 24,
      }}>
        Your learning journey, mapped out phase by phase
      </p>

      {/* ─── Goal Tabs (if multiple) ─── */}
      {selectedGoals.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 12, marginBottom: 16,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {selectedGoals.map((goal, idx) => {
            const active = idx === activeGoalIdx;
            const goalData = GOALS.find(g => g.id === goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => setActiveGoalIdx(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 12,
                  border: `1px solid ${active ? t.violet : t.border}`,
                  background: active ? `${t.violet}12` : t.bgCard,
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {goalData && <NeonIcon type={goalData.icon} size={16} color={active ? 'violet' : 'muted'} />}
                <span style={{
                  fontFamily: t.display, fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? t.text : t.textSecondary,
                }}>
                  {goal.label}
                </span>
                {active && (
                  <div style={{
                    position: 'absolute', bottom: -1, left: '20%', right: '20%',
                    height: 2, borderRadius: 1, background: t.gradient,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Active Roadmap Header ─── */}
      {activeGoal && (
        <div style={{
          padding: 20, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {activeGoalData && (
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${t.violet}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <NeonIcon type={activeGoalData.icon} size={22} color="violet" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text,
                marginBottom: 4,
              }}>
                {activeGoal.label}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.textMuted,
                }}>
                  ~{totalWeeks} weeks
                </span>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.textMuted,
                }}>
                  {dailyMinutes} min/day
                </span>
                {/* Skill level badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 10,
                  color: levelRarity.color,
                  background: `${levelRarity.color}12`,
                  textTransform: 'uppercase',
                }}>
                  {levelRarity.icon} {assessment?.level || 'beginner'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#252530', overflow: 'hidden' }}>
              <div style={{
                width: '0%', height: '100%', borderRadius: 3,
                background: t.gradient,
                transition: 'width 0.6s ease-out',
              }} />
            </div>
            <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 800, color: t.cyan }}>
              0%
            </span>
          </div>
        </div>
      )}

      {/* ─── Vertical Timeline ─── */}
      {activeGoal ? (
        <div style={{ position: 'relative', paddingLeft: 40 }}>
          {/* Vertical line — centered on node axis (14px from left) */}
          <div style={{
            position: 'absolute', left: 13, top: 0, bottom: 0,
            width: 2, borderRadius: 1,
            background: `linear-gradient(to bottom, ${t.violet}40, ${t.border}, ${t.border})`,
          }} />

          {PHASES.map((phase, i) => {
            const isActive = i === 0;
            const isLocked = i > 0;
            const isCapstone = i === PHASES.length - 1;
            const r = rarity[phase.rarity];

            return (
              <div
                key={phase.title}
                style={{
                  position: 'relative', marginBottom: i < PHASES.length - 1 ? 16 : 0,
                  animation: `fadeUp 0.4s ease-out ${i * 0.08}s both`,
                }}
              >
                {/* Node — 28px circle, center at 14px from container left */}
                <div style={{
                  position: 'absolute', left: -40, top: 12,
                  width: 28, height: 28,
                  borderRadius: '50%', zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? t.violet : isLocked ? '#252530' : `${r.color}20`,
                  border: `2px solid ${isActive ? t.violet : r.color}`,
                  boxShadow: isActive ? `0 0 12px ${t.violet}40` : isCapstone ? `0 0 8px ${r.color}30` : 'none',
                  animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
                }}>
                  {isCapstone ? (
                    <NeonIcon type="crown" size={14} color={isLocked ? 'muted' : r.color} />
                  ) : isActive ? (
                    <span style={{
                      fontFamily: t.mono, fontSize: 11, fontWeight: 800, color: '#FFF',
                    }}>
                      {i + 1}
                    </span>
                  ) : (
                    <span style={{
                      fontFamily: t.mono, fontSize: 11, fontWeight: 800,
                      color: isLocked ? t.textMuted : r.color,
                    }}>
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Card */}
                <div style={{
                  padding: 16, borderRadius: 16,
                  background: t.bgCard,
                  border: `1px solid ${isActive ? `${t.violet}40` : isCapstone ? `${r.color}30` : t.border}`,
                  opacity: isLocked ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  animation: isCapstone ? 'glowPulse 3s ease-in-out infinite' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <NeonIcon
                      type={isLocked && !isCapstone ? 'lock' : phase.icon}
                      size={18}
                      color={isActive ? 'violet' : isLocked ? 'muted' : r.color}
                      active={isActive}
                    />
                    <span style={{
                      fontFamily: t.display, fontSize: 15, fontWeight: 700,
                      color: isLocked ? t.textMuted : t.text, flex: 1,
                    }}>
                      {phase.title}
                    </span>
                    {/* Week badge */}
                    <span style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                      color: t.textMuted, padding: '2px 8px', borderRadius: 8,
                      background: `${t.border}`,
                    }}>
                      {weekRanges[i]}
                    </span>
                  </div>

                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textMuted,
                    marginBottom: 8, lineHeight: 1.4,
                  }}>
                    {phase.desc}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Rarity badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 8,
                      color: r.color, background: `${r.color}10`,
                      textTransform: 'uppercase',
                    }}>
                      {r.icon} {r.label}
                    </span>

                    {/* Progress bar */}
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#252530', overflow: 'hidden' }}>
                      <div style={{
                        width: '0%', height: '100%', borderRadius: 2,
                        background: `linear-gradient(90deg, ${r.color}, ${t.cyan})`,
                        transition: 'width 0.6s ease-out',
                      }} />
                    </div>

                    {/* Quest count */}
                    <span style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                      color: t.textMuted, whiteSpace: 'nowrap',
                    }}>
                      0/{phase.taskCount} quests
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          padding: 40, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <NeonIcon type="map" size={40} color="muted" />
          </div>
          <p style={{ fontFamily: t.display, fontSize: 16, fontWeight: 700, color: t.textMuted, marginBottom: 4 }}>
            No quests available
          </p>
          <p style={{ fontFamily: t.body, fontSize: 13, color: t.textMuted }}>
            Complete onboarding to begin your quest log
          </p>
        </div>
      )}
    </div>
  );
}
