'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmapStore, useOnboardingStore, useI18nStore } from '@plan2skill/store';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity, skillLevelRarity } from '../../../(onboarding)/_components/tokens';
import type { GoalSelection, SkillAssessment, Roadmap, Milestone, Task, Rarity, MilestoneStatus, TaskStatus, TaskType, RoadmapStatus } from '@plan2skill/types';

// ─── Mock roadmap builder (pre-auth fallback) ──

const MOCK_PHASES: { title: string; desc: string; rarity: Rarity; taskCount: number }[] = [
  { title: 'Foundations & Setup', desc: 'Build your base knowledge and set up your environment', rarity: 'common', taskCount: 12 },
  { title: 'Core Concepts', desc: 'Master the fundamental skills and core patterns', rarity: 'uncommon', taskCount: 15 },
  { title: 'Practical Projects', desc: 'Apply your knowledge through hands-on building', rarity: 'rare', taskCount: 14 },
  { title: 'Advanced Patterns', desc: 'Level up with advanced techniques and edge cases', rarity: 'epic', taskCount: 13 },
  { title: 'Capstone Challenge', desc: 'Prove your mastery with a final boss challenge', rarity: 'legendary', taskCount: 5 },
];

function buildMockRoadmap(goalLabel: string, goalId: string, totalWeeks: number, dailyMinutes: number): Roadmap {
  const proportions = [0.15, 0.2, 0.3, 0.2, 0.15];
  let weekStart = 1;
  const milestones: Milestone[] = MOCK_PHASES.map((phase, i) => {
    const weeks = Math.max(1, Math.round(totalWeeks * proportions[i]!));
    const wEnd = Math.min(weekStart + weeks - 1, totalWeeks);
    const tasks: Task[] = Array.from({ length: phase.taskCount }, (_, j) => ({
      id: `mock-task-${goalId}-${i}-${j}`,
      milestoneId: `mock-ms-${goalId}-${i}`,
      title: `Quest ${j + 1}`,
      description: '',
      taskType: (['article', 'quiz', 'project', 'video', 'review'] as TaskType[])[j % 5]!,
      estimatedMinutes: dailyMinutes,
      xpReward: 20 + i * 10,
      coinReward: 5 + i * 3,
      rarity: phase.rarity,
      status: 'locked' as TaskStatus,
      order: j,
      completedAt: null,
    }));
    if (i === 0) tasks[0] = { ...tasks[0]!, status: 'available' };
    const ms: Milestone = {
      id: `mock-ms-${goalId}-${i}`,
      roadmapId: `mock-roadmap-${goalId}`,
      title: phase.title,
      description: phase.desc,
      weekStart,
      weekEnd: wEnd,
      order: i,
      status: (i === 0 ? 'active' : 'locked') as MilestoneStatus,
      progress: 0,
      tasks,
    };
    weekStart = wEnd + 1;
    return ms;
  });
  return {
    id: `mock-roadmap-${goalId}`,
    userId: 'mock',
    title: `${goalLabel} Roadmap`,
    goal: goalLabel,
    description: `Your ${totalWeeks}-week journey to master ${goalLabel}`,
    durationDays: totalWeeks * 7,
    dailyMinutes,
    status: 'active' as RoadmapStatus,
    progress: 0,
    aiModel: 'mock',
    milestones,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface ActiveQuestsProps {
  selectedGoals: GoalSelection[];
  skillAssessments: SkillAssessment[];
}

export function ActiveQuests({ selectedGoals, skillAssessments }: ActiveQuestsProps) {
  const tr = useI18nStore((s) => s.t);
  const router = useRouter();
  const serverRoadmaps = useRoadmapStore((s) => s.roadmaps);
  const { dailyMinutes, aiEstimateWeeks } = useOnboardingStore();

  // prefers-reduced-motion guard
  const prefersReduced = useRef(false);
  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Hover state for quest line cards
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Resolve roadmaps: server data or mock from onboarding
  const roadmaps = useMemo<Roadmap[]>(() => {
    if (serverRoadmaps.length > 0) return serverRoadmaps;
    if (!selectedGoals.length) return [];
    const weeks = aiEstimateWeeks || 12;
    return selectedGoals.map((g) => buildMockRoadmap(g.label, g.id, weeks, dailyMinutes));
  }, [serverRoadmaps, selectedGoals, dailyMinutes, aiEstimateWeeks]);

  return (
    <div style={{ marginTop: 32, marginBottom: 32 }}>
      <h2 style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: t.display, fontSize: 13, fontWeight: 700,
        color: t.textSecondary, textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 14,
      }}>
        <NeonIcon type="scroll" size={14} color="cyan" />
        {tr('dashboard.quest_lines', 'Quest Lines')}
      </h2>

      {roadmaps.length === 0 ? (
        <div style={{
          padding: 40, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 12,
            animation: prefersReduced.current ? 'none' : 'float 3s ease-in-out infinite',
          }}>
            <NeonIcon type="scroll" size={40} color="muted" />
          </div>
          <p style={{ fontFamily: t.display, fontSize: 16, fontWeight: 700, color: t.textMuted, marginBottom: 4 }}>
            {tr('dashboard.no_quest_lines', 'No quest lines yet, hero!')}
          </p>
          <p style={{ fontFamily: t.body, fontSize: 13, color: t.textMuted }}>
            {tr('quest.begin_journey', 'Complete onboarding to begin your journey')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roadmaps.map((rm, i) => {
            const isCompleted = rm.status === 'completed';
            const isGenerating = rm.status === 'generating';
            const activeMilestone = rm.milestones.find((m) => m.status === 'active');
            const totalQuests = rm.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
            const completedQuests = rm.milestones.reduce(
              (sum, m) => sum + m.tasks.filter((tk) => tk.status === 'completed').length, 0,
            );
            const progress = Math.round(rm.progress);

            // Match goal assessment for skill level badge
            const goal = selectedGoals.find((g) => rm.goal === g.label);
            const assessment = goal ? skillAssessments.find((a) => a.goalId === goal.id) : null;
            const lr = assessment ? skillLevelRarity[assessment.level as keyof typeof skillLevelRarity] : rarity.common;

            const borderColor = isCompleted ? t.gold : t.border;

            return (
              <div key={rm.id} style={{ animation: `fadeUp 0.4s ease-out ${i * 0.1}s both` }}>
              <button
                onClick={() => router.push(`/roadmap/${rm.id}`)}
                onMouseEnter={() => setHoveredCard(rm.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: 20, borderRadius: 16,
                  background: t.bgCard,
                  border: `1px solid ${hoveredCard === rm.id ? (isCompleted ? t.gold : t.violet) : borderColor}`,
                  transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transform: hoveredCard === rm.id ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: hoveredCard === rm.id
                    ? `0 8px 24px rgba(0,0,0,0.25)${isCompleted ? `, 0 0 12px ${t.gold}20` : ''}`
                    : (isCompleted ? `0 0 12px ${t.gold}20` : 'none'),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: isCompleted ? `${t.gold}15` : `${t.violet}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCompleted ? (
                      <NeonIcon type="trophy" size={22} color={t.gold} />
                    ) : isGenerating ? (
                      <NeonIcon type="fire" size={22} color="violet" />
                    ) : (
                      <NeonIcon type="target" size={22} color="violet" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.text,
                      marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {rm.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        aria-label={`Skill level: ${assessment?.level || 'beginner'}, rarity: ${lr.icon}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10,
                          color: lr.color,
                          background: `${lr.color}12`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {lr.icon} {assessment?.level || 'beginner'}
                      </span>
                      {isCompleted && (
                        <span style={{
                          fontFamily: t.mono, fontSize: 9, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 10,
                          color: t.gold, background: `${t.gold}15`,
                          textTransform: 'uppercase',
                        }}>
                          {tr('quest.line_complete', 'Quest Line Complete!')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: t.mono, fontSize: 13, fontWeight: 800,
                    color: isCompleted ? t.gold : t.cyan,
                  }}>
                    {progress}%
                  </span>
                </div>

                {/* ── Horizontal milestone path ── */}
                <div style={{ position: 'relative', padding: '6px 0 28px', margin: '4px 0 0' }}>
                  {/* Background track line */}
                  <div style={{
                    position: 'absolute',
                    top: 20, left: 16, right: 16,
                    height: 3, borderRadius: 2,
                    background: t.border,
                  }} />
                  {/* Progress fill on track */}
                  <div style={{
                    position: 'absolute',
                    top: 20, left: 16, right: 16,
                    height: 3, borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      background: isCompleted
                        ? `linear-gradient(90deg, ${t.gold}, ${t.cyan})`
                        : t.gradient,
                      transform: `scaleX(${progress / 100})`,
                      transformOrigin: 'left',
                      transition: 'transform 0.6s ease-out',
                      boxShadow: progress >= 85 && !isCompleted && !prefersReduced.current
                        ? `0 0 8px rgba(78,205,196,0.3)` : 'none',
                    }} />
                  </div>

                  {/* Milestone icons on the line */}
                  <div style={{
                    position: 'relative', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '0 4px',
                  }}>
                    {rm.milestones.map((ms, j) => {
                      const msCompleted = ms.status === 'completed';
                      const msActive = ms.status === 'active';
                      const isBoss = j === rm.milestones.length - 1;
                      const iconSize = isBoss ? 22 : 16;
                      const nodeSize = isBoss ? 34 : 26;

                      const iconColor = msCompleted
                        ? (isBoss ? t.gold : t.cyan)
                        : msActive
                          ? t.violet
                          : t.textMuted;

                      return (
                        <div key={ms.id} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          flex: 1, minWidth: 0,
                        }}>
                          {/* Icon node */}
                          <div style={{
                            position: 'relative',
                            width: nodeSize, height: nodeSize,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: msCompleted
                              ? `${iconColor}18`
                              : msActive
                                ? `${t.violet}15`
                                : `${t.border}`,
                            border: msActive
                              ? `2px solid ${t.violet}`
                              : msCompleted
                                ? `2px solid ${iconColor}40`
                                : `1px solid ${t.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: msActive
                              ? `0 0 10px ${t.violet}50`
                              : msCompleted && isBoss
                                ? `0 0 12px ${t.gold}30`
                                : 'none',
                            animation: msActive && !prefersReduced.current
                              ? 'pulse 2s ease-in-out infinite' : 'none',
                            transition: 'all 0.3s ease',
                          }}>
                            <NeonIcon
                              type={isBoss ? 'trophy' : 'medal'}
                              size={iconSize}
                              color={iconColor}
                            />
                            {/* Shine sweep on locked milestones */}
                            {!msCompleted && !msActive && !prefersReduced.current && (
                              <div style={{
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '100%',
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 100%)',
                                animation: `shineSweep ${5 + j * 0.7}s ease-in-out infinite`,
                                animationDelay: `${j * 1.2}s`,
                                pointerEvents: 'none',
                              }} />
                            )}
                          </div>
                          {/* Milestone label */}
                          <span style={{
                            fontFamily: t.mono, fontSize: 8, fontWeight: 600,
                            color: msActive ? t.text : msCompleted ? t.textSecondary : t.textMuted,
                            textAlign: 'center',
                            marginTop: 4,
                            lineHeight: 1.2,
                            width: '100%',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}>
                            {ms.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer: quest count */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <p style={{
                    fontFamily: t.body, fontSize: 11, color: t.textMuted, margin: 0,
                  }}>
                    {isGenerating
                      ? tr('quest.forging', 'Forging your quest line...')
                      : isCompleted
                        ? tr('quest.all_conquered', 'All milestones conquered!')
                        : activeMilestone
                          ? tr('quest.current_milestone', 'Current milestone: {title}').replace('{title}', activeMilestone.title)
                          : tr('quest.ready', 'Ready to begin')}
                  </p>
                  <span style={{
                    fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                    color: t.textMuted,
                  }}>
                    {tr('quest.count', '{done}/{total} quests').replace('{done}', String(completedQuests)).replace('{total}', String(totalQuests))}
                  </span>
                </div>

                {/* Generating shimmer */}
                {isGenerating && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 10, marginTop: 8,
                    background: `${t.violet}08`,
                  }}>
                    <NeonIcon type="fire" size={14} color="violet" />
                    <span style={{
                      fontFamily: t.body, fontSize: 12, fontWeight: 600,
                      color: t.violet,
                      animation: 'shimmer 2s linear infinite',
                      backgroundImage: `linear-gradient(90deg, ${t.violet}, ${t.cyan}, ${t.violet})`,
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Forging...
                    </span>
                  </div>
                )}
              </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
