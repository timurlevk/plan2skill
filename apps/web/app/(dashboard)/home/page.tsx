'use client';

import React, { useState, useMemo } from 'react';
import { useOnboardingStore } from '@plan2skill/store';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t, rarity, skillLevelRarity } from '../../(onboarding)/_components/tokens';
import { CHARACTERS } from '../../(onboarding)/_components/characters';
import { GOALS } from '../../(onboarding)/_data/goals';
import { ARCHETYPES } from '../../(onboarding)/_data/archetypes';

// ═══════════════════════════════════════════
// COMMAND CENTER — Dashboard home page
// Greeting, stats, active quests, today's quests
// ═══════════════════════════════════════════

// ─── Mock task generator ───
const TASK_TEMPLATES = [
  { titleFn: (g: string) => `Read: Introduction to ${g}`, type: 'article', xp: 15, rarity: 'common' as const, mins: 5 },
  { titleFn: (g: string) => `Watch: ${g} Fundamentals`, type: 'video', xp: 25, rarity: 'common' as const, mins: 10 },
  { titleFn: (g: string) => `Quiz: ${g} Basics`, type: 'quiz', xp: 30, rarity: 'uncommon' as const, mins: 5 },
  { titleFn: (g: string) => `Build: ${g} Mini-Project`, type: 'project', xp: 50, rarity: 'rare' as const, mins: 20 },
];

function generateTasks(goalLabel: string, goalId: string) {
  const seed = goalId.length;
  const count = 2 + (seed % 2); // 2 or 3 tasks
  return TASK_TEMPLATES.slice(0, count).map((tmpl, i) => ({
    id: `${goalId}-task-${i}`,
    title: tmpl.titleFn(goalLabel),
    type: tmpl.type,
    xp: tmpl.xp,
    rarity: tmpl.rarity,
    mins: tmpl.mins,
    done: false,
  }));
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const { selectedGoals, skillAssessments, characterId, archetypeId, xpTotal, level } = useOnboardingStore();
  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;

  // Collapsible groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

  // Generate tasks per goal
  const questGroups = useMemo(() => {
    return selectedGoals.map(g => {
      const goalData = GOALS.find(gd => gd.id === g.id);
      return {
        goal: g,
        goalData,
        tasks: generateTasks(g.label, g.id),
      };
    });
  }, [selectedGoals]);

  // Default all expanded
  const isExpanded = (id: string) => expandedGroups[id] !== false;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* ─── Greeting ─── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: t.display, fontSize: 26, fontWeight: 900,
          color: t.text, marginBottom: 6, lineHeight: 1.3,
        }}>
          {getGreeting()}, {charMeta?.name || 'Hero'}!
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: t.body, fontSize: 14, color: t.textSecondary }}>
            Today&apos;s focus: Level up your skills
          </span>
          {archetype && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 10px', borderRadius: 20,
              background: `${archetype.color}12`, border: `1px solid ${archetype.color}25`,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: archetype.color,
            }}>
              {archetype.icon} {archetype.name}
            </span>
          )}
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginBottom: 32 }}>
        {([
          { label: 'Level', value: String(level), color: 'violet' as const, icon: 'lightning' as const },
          { label: 'Streak', value: '0 days', color: 'gold' as const, icon: 'fire' as const },
          { label: 'XP', value: String(xpTotal), color: 'cyan' as const, icon: 'xp' as const },
          { label: 'Energy', value: '3/3', color: 'violet' as const, icon: 'gem' as const },
        ]).map((stat) => {
          // Map named color to hex for text
          const hexMap = { violet: t.violet, gold: t.gold, cyan: t.cyan } as const;
          const hex = hexMap[stat.color];
          return (
            <div
              key={stat.label}
              style={{
                padding: 16, borderRadius: 16,
                background: t.bgCard, border: `1px solid ${t.border}`,
                animation: 'fadeUp 0.4s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <NeonIcon type={stat.icon} size={16} color={stat.color} />
                <span style={{ fontFamily: t.body, fontSize: 12, color: t.textSecondary }}>
                  {stat.label}
                </span>
              </div>
              <div style={{
                fontFamily: t.mono, fontSize: 20, fontWeight: 800, color: hex,
              }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Active Quests ─── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: 14,
        }}>
          <NeonIcon type="target" size={14} color="cyan" />
          Active Quests
        </h2>

        {selectedGoals.length === 0 ? (
          <div style={{
            padding: 40, borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <NeonIcon type="target" size={40} color="muted" />
            </div>
            <p style={{ fontFamily: t.display, fontSize: 16, fontWeight: 700, color: t.textMuted, marginBottom: 4 }}>
              No quests available
            </p>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.textMuted }}>
              Complete onboarding to begin your journey
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedGoals.map((goal, i) => {
              const goalData = GOALS.find(gd => gd.id === goal.id);
              const assessment = skillAssessments.find(a => a.goalId === goal.id);
              const lr = assessment ? skillLevelRarity[assessment.level as keyof typeof skillLevelRarity] : rarity.common;

              return (
                <div
                  key={goal.id}
                  style={{
                    padding: 20, borderRadius: 16,
                    background: t.bgCard, border: `1px solid ${t.border}`,
                    animation: `fadeUp 0.4s ease-out ${i * 0.1}s both`,
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {goalData && (
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: `${t.violet}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <NeonIcon type={goalData.icon} size={22} color="violet" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.text,
                        marginBottom: 2,
                      }}>
                        {goal.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Skill level rarity badge — double-coded: icon + color */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10,
                          color: lr.color,
                          background: `${lr.color}12`,
                          textTransform: 'uppercase',
                        }}>
                          {lr.icon} {assessment?.level || 'beginner'}
                        </span>
                        {goalData && (
                          <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
                            ~{goalData.estimatedWeeks} weeks
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress */}
                    <span style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 800, color: t.cyan }}>
                      0%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 2, background: '#252530', overflow: 'hidden' }}>
                    <div style={{
                      width: '0%', height: '100%', borderRadius: 3,
                      background: t.gradient,
                      transition: 'width 0.6s ease-out',
                    }} />
                  </div>
                  <p style={{
                    fontFamily: t.body, fontSize: 11, color: t.textMuted,
                    marginTop: 8,
                  }}>
                    Current milestone: Foundations &amp; Setup
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Today's Quests ─── */}
      <div>
        <h2 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: 14,
        }}>
          <NeonIcon type="sparkle" size={14} color="gold" />
          Today&apos;s Quests
        </h2>

        {questGroups.length === 0 ? (
          <div style={{
            padding: 32, borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.border}`,
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <NeonIcon type="sparkle" size={32} color="muted" />
            </div>
            <p style={{ fontFamily: t.body, fontSize: 14, color: t.textMuted }}>
              No quests available yet
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questGroups.map(({ goal, goalData, tasks }, gi) => (
              <div key={goal.id} style={{ animation: `fadeUp 0.4s ease-out ${gi * 0.08}s both` }}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(goal.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '8px 0', marginBottom: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {goalData && <NeonIcon type={goalData.icon} size={16} color="violet" />}
                  <span style={{
                    fontFamily: t.display, fontSize: 14, fontWeight: 700, color: t.text,
                    flex: 1,
                  }}>
                    {goal.label}
                  </span>
                  <span style={{
                    fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                    color: t.textMuted, padding: '2px 8px', borderRadius: 8,
                    background: `${t.violet}10`,
                  }}>
                    {tasks.length} quests
                  </span>
                  <span style={{
                    color: t.textMuted, fontSize: 12, display: 'inline-block',
                    transform: isExpanded(goal.id) ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease',
                  }}>
                    ▾
                  </span>
                </button>

                {/* Tasks */}
                {isExpanded(goal.id) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks.map((task, ti) => {
                      const r = rarity[task.rarity];
                      return (
                        <div
                          key={task.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', borderRadius: 16,
                            background: t.bgCard, border: `1px solid ${t.border}`,
                            cursor: 'pointer', transition: 'border-color 0.2s ease',
                            animation: `fadeUp 0.3s ease-out ${ti * 0.05}s both`,
                          }}
                        >
                          {/* Checkbox — 24px visual in 44px touch area */}
                          <div style={{
                            width: 44, height: 44, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '-10px -6px -10px -8px',
                          }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              border: `2px solid ${t.borderHover}`,
                              transition: 'all 0.2s ease',
                            }} />
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily: t.body, fontSize: 14, fontWeight: 500,
                              color: t.text, marginBottom: 4,
                            }}>
                              {task.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {/* Type badge — double-coded: rarity icon + color */}
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                                padding: '2px 8px', borderRadius: 8,
                                color: r.color, background: `${r.color}10`,
                                textTransform: 'uppercase',
                              }}>
                                {r.icon} {task.type}
                              </span>
                              {/* Duration */}
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontFamily: t.body, fontSize: 11, color: t.textMuted,
                              }}>
                                <NeonIcon type="clock" size={11} color="muted" />
                                {task.mins} min
                              </span>
                            </div>
                          </div>

                          {/* XP reward */}
                          <span style={{
                            fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                            color: t.violet, flexShrink: 0,
                          }}>
                            +{task.xp} XP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
