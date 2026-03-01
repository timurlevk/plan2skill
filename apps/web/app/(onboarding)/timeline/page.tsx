'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@plan2skill/store';
import { t, skillLevelRarity, rarity } from '../_components/tokens';
import { StepBar } from '../_components/StepBar';
import { ContinueButton, BackButton } from '../_components/ContinueButton';
import { GOALS } from '../_data/goals';
import { calculateEstimate, detectMismatch } from '../_data/timeline-logic';
import { NeonIcon } from '../_components/NeonIcon';

// ═══════════════════════════════════════════
// TIMELINE — Per-skill phase cards (Step 5/5)
// Overview rings → tab per skill → rarity-coded phase path
// ═══════════════════════════════════════════

const DAILY_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hr' },
  { value: 120, label: '2 hr' },
];

const TARGET_OPTIONS = [
  { value: 1,  label: '1 mo' },
  { value: 3,  label: '3 mo' },
  { value: 6,  label: '6 mo' },
  { value: 12, label: '12 mo' },
];

// Phase definitions with rarity progression
const PHASES = [
  { name: 'Foundations & Setup', desc: 'Environment, basics, first exercises', rarity: rarity.common, pctStart: 0, pctEnd: 0.2, quests: 5, xp: 200 },
  { name: 'Core Concepts', desc: 'Key principles, essential patterns', rarity: rarity.uncommon, pctStart: 0.2, pctEnd: 0.4, quests: 8, xp: 400 },
  { name: 'Practical Projects', desc: 'Hands-on projects, real-world practice', rarity: rarity.rare, pctStart: 0.4, pctEnd: 0.65, quests: 6, xp: 600 },
  { name: 'Advanced Patterns', desc: 'Deeper patterns, optimization', rarity: rarity.epic, pctStart: 0.65, pctEnd: 0.85, quests: 5, xp: 500 },
  { name: 'Capstone Challenge', desc: 'Final challenge — prove your mastery', rarity: rarity.legendary, pctStart: 0.85, pctEnd: 1.0, quests: 3, xp: 800 },
];

// Progress ring component
function ProgressRing({ percent, color, size = 52, strokeWidth = 4 }: {
  percent: number; color: string; size?: number; strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#252530" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  );
}

export default function TimelinePage() {
  const router = useRouter();
  const {
    selectedGoals,
    skillAssessments,
    dailyMinutes,
    targetMonths,
    setTimeline,
  } = useOnboardingStore();

  const [localDaily, setLocalDaily] = useState(dailyMinutes || 30);
  const [localTarget, setLocalTarget] = useState(targetMonths || 3);
  const [activeTab, setActiveTab] = useState(0);

  // Get full goal data — with fallback for custom goals
  const goalData = useMemo(() =>
    selectedGoals.map(g => {
      const found = GOALS.find(gd => gd.id === g.id);
      if (found) return found;
      return {
        id: g.id,
        label: g.label,
        category: g.category,
        popularity: 0,
        icon: 'target' as const,
        relatedSkills: [],
        estimatedWeeks: 12,
      };
    }),
    [selectedGoals]
  );

  // Calculate estimate
  const estimate = useMemo(() => {
    const assessments = skillAssessments.map(a => ({ goalId: a.goalId, level: a.level }));
    return calculateEstimate(goalData, assessments, localDaily);
  }, [goalData, skillAssessments, localDaily]);

  // Detect mismatch
  const mismatch = useMemo(
    () => detectMismatch(estimate.totalWeeks, localTarget),
    [estimate.totalWeeks, localTarget]
  );

  // Update store when user changes values
  useEffect(() => {
    setTimeline(localDaily, localTarget, estimate.totalWeeks);
  }, [localDaily, localTarget, estimate.totalWeeks]);

  // Current skill data
  const currentGoalEstimate = estimate.perGoal[activeTab];
  const currentGoal = selectedGoals[activeTab];
  const tw = Math.max(4, currentGoalEstimate?.weeks ?? 12);

  return (
    <div style={{ animation: 'fadeUp 0.6s ease-out' }}>
      <StepBar current={4} />

      <BackButton onClick={() => router.push('/forge')} />
      <div style={{ height: 16 }} />

      <h1 style={{
        fontFamily: t.display, fontSize: 26, fontWeight: 800,
        color: t.text, marginBottom: 6, lineHeight: 1.2,
      }}>
        Your Quest Roadmap
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        marginBottom: 20, lineHeight: 1.5,
      }}>
        Set your pace, see your journey per skill
      </p>

      {/* Time selectors — compact inline */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20,
        animation: 'fadeUp 0.4s ease-out 0.1s both',
      }}>
        {/* Daily time */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: t.body, fontSize: 11, fontWeight: 600,
            color: t.textMuted, marginBottom: 6, textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Daily pace
          </p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {DAILY_OPTIONS.map(opt => {
              const isActive = localDaily === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setLocalDaily(opt.value)}
                  style={{
                    padding: '6px 10px', borderRadius: 8,
                    border: `1.5px solid ${isActive ? t.cyan : t.border}`,
                    background: isActive ? `${t.cyan}10` : 'transparent',
                    color: isActive ? t.cyan : t.textMuted,
                    fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target time */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        animation: 'fadeUp 0.4s ease-out 0.15s both',
      }}>
        <span style={{
          fontFamily: t.body, fontSize: 11, fontWeight: 600,
          color: t.textMuted, textTransform: 'uppercase',
          letterSpacing: '0.05em', alignSelf: 'center', marginRight: 4,
        }}>
          Target
        </span>
        {TARGET_OPTIONS.map(opt => {
          const isActive = localTarget === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setLocalTarget(opt.value)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: `1.5px solid ${isActive ? t.violet : t.border}`,
                background: isActive ? `${t.violet}10` : 'transparent',
                color: isActive ? t.violet : t.textMuted,
                fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Mismatch Warning — compact */}
      {mismatch.hasMismatch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10,
          background: `${t.gold}08`, border: `1px solid ${t.gold}20`,
          marginBottom: 20, animation: 'fadeUp 0.3s ease-out',
        }}>
          <NeonIcon type="lightning" size={14} color="gold" active />
          <span style={{
            fontFamily: t.body, fontSize: 12, color: t.gold, fontWeight: 600,
          }}>
            Timeline is tight — try more time or extend target
          </span>
        </div>
      )}

      {/* Overview: Progress rings per skill */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        marginBottom: 20, animation: 'fadeUp 0.5s ease-out 0.2s both',
      }}>
        {estimate.perGoal.map((item, i) => {
          const isActive = activeTab === i;
          const rarityInfo = skillLevelRarity[item.level];
          // Progress is hypothetical (0% — hasn't started)
          const ringColor = rarityInfo.color;
          return (
            <button
              key={item.goalId}
              onClick={() => setActiveTab(i)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '10px 12px', borderRadius: 14,
                border: `2px solid ${isActive ? ringColor : 'transparent'}`,
                background: isActive ? `${ringColor}08` : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s ease',
                flex: 1, maxWidth: 120,
              }}
            >
              <div style={{ position: 'relative' }}>
                <ProgressRing percent={0} color={ringColor} size={48} strokeWidth={3} />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                    color: ringColor,
                  }}>
                    ~{item.weeks}w
                  </span>
                </div>
              </div>
              <span style={{
                fontFamily: t.body, fontSize: 11, fontWeight: 600,
                color: isActive ? t.text : t.textMuted,
                textAlign: 'center', lineHeight: 1.2,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {item.label}
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                color: rarityInfo.color,
              }}>
                {rarityInfo.icon} {item.level}
              </span>
            </button>
          );
        })}
      </div>

      {/* Skill tab indicator (if multiple) */}
      {selectedGoals.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16,
        }}>
          {selectedGoals.map((_, i) => (
            <div key={i} style={{
              width: activeTab === i ? 20 : 6, height: 6, borderRadius: 3,
              background: activeTab === i
                ? (skillLevelRarity[estimate.perGoal[i]?.level ?? 'beginner'].color)
                : '#35354A',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}

      {/* Per-skill phase cards path */}
      <div style={{
        animation: 'fadeUp 0.5s ease-out',
        marginBottom: 24,
      }} key={activeTab}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
        }}>
          <NeonIcon type="target" size={16} color="violet" active />
          <span style={{
            fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.text,
          }}>
            {currentGoal?.label ?? 'Skill'} — Quest Map
          </span>
        </div>

        {/* Vertical phase path with cards */}
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          {/* Vertical connector line */}
          <div style={{
            position: 'absolute', left: 11, top: 8, bottom: 8,
            width: 2, borderRadius: 1,
            background: `linear-gradient(to bottom, ${rarity.common.color}40, ${rarity.legendary.color}40)`,
          }} />

          {PHASES.map((phase, i) => {
            const weekStart = Math.max(1, Math.ceil(tw * phase.pctStart) + 1);
            const weekEnd = Math.ceil(tw * phase.pctEnd);
            const weekLabel = i === 0 ? `W1–${weekEnd}` : `W${weekStart}–${weekEnd}`;
            const isFinal = i === PHASES.length - 1;

            return (
              <div key={i} style={{
                position: 'relative',
                marginBottom: i < PHASES.length - 1 ? 8 : 0,
                animation: `fadeUp 0.4s ease-out ${i * 0.08}s both`,
              }}>
                {/* Node on the line */}
                <div style={{
                  position: 'absolute',
                  left: -22,
                  top: 14,
                  width: isFinal ? 22 : 16,
                  height: isFinal ? 22 : 16,
                  borderRadius: isFinal ? 6 : '50%',
                  background: `${phase.rarity.color}15`,
                  border: `2.5px solid ${phase.rarity.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isFinal ? 10 : 8,
                  color: phase.rarity.color,
                  zIndex: 1,
                  boxShadow: isFinal ? `0 0 12px ${phase.rarity.color}30` : 'none',
                  animation: isFinal ? 'glowPulse 2s ease-in-out infinite' : 'none',
                }}>
                  {phase.rarity.icon}
                </div>

                {/* Phase card */}
                <div style={{
                  background: t.bgCard,
                  borderRadius: 14,
                  padding: '12px 14px',
                  border: `1px solid ${phase.rarity.color}20`,
                  borderLeft: `3px solid ${phase.rarity.color}`,
                  marginLeft: 6,
                }}>
                  {/* Header row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 4,
                  }}>
                    <span style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                      color: phase.rarity.color,
                      background: `${phase.rarity.color}12`,
                      padding: '2px 6px', borderRadius: 4,
                    }}>
                      {weekLabel}
                    </span>
                    <span style={{
                      fontFamily: t.display, fontSize: 13, fontWeight: 700,
                      color: t.text, flex: 1,
                    }}>
                      {phase.name}
                    </span>
                  </div>

                  {/* Description + meta */}
                  <p style={{
                    fontFamily: t.body, fontSize: 12, color: t.textMuted,
                    margin: '0 0 6px', lineHeight: 1.4,
                  }}>
                    {phase.desc}
                  </p>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                      color: t.textMuted,
                    }}>
                      ~{phase.quests} quests
                    </span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                      color: t.gold,
                    }}>
                      +{phase.xp} XP
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                      color: phase.rarity.color,
                      textTransform: 'uppercase',
                    }}>
                      {phase.rarity.icon} {phase.rarity.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ContinueButton onClick={() => router.push('/home')}>
        Enter Command Center
      </ContinueButton>
    </div>
  );
}
