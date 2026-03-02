'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmapStore, useOnboardingStore } from '@plan2skill/store';
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
  const router = useRouter();
  const serverRoadmaps = useRoadmapStore((s) => s.roadmaps);
  const { dailyMinutes, aiEstimateWeeks } = useOnboardingStore();

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
        <NeonIcon type="compass" size={14} color="cyan" />
        Quest Lines
      </h2>

      {roadmaps.length === 0 ? (
        <div style={{
          padding: 40, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <NeonIcon type="compass" size={40} color="muted" />
          </div>
          <p style={{ fontFamily: t.display, fontSize: 16, fontWeight: 700, color: t.textMuted, marginBottom: 4 }}>
            No quest lines yet, hero!
          </p>
          <p style={{ fontFamily: t.body, fontSize: 13, color: t.textMuted }}>
            Complete onboarding to begin your journey
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
              <button
                key={rm.id}
                onClick={() => router.push(`/roadmap/${rm.id}`)}
                style={{
                  padding: 20, borderRadius: 16,
                  background: t.bgCard, border: `1px solid ${borderColor}`,
                  animation: `fadeUp 0.4s ease-out ${i * 0.1}s both`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  boxShadow: isCompleted ? `0 0 12px ${t.gold}20` : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isCompleted ? t.gold : t.violet;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.transform = 'translateY(0)';
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
                          Quest Line Complete!
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

                {/* Mini-timeline dots */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  marginBottom: 10,
                }}>
                  {rm.milestones.map((ms, j) => {
                    const msCompleted = ms.status === 'completed';
                    const msActive = ms.status === 'active';
                    const isBoss = j === rm.milestones.length - 1;
                    return (
                      <React.Fragment key={ms.id}>
                        {j > 0 && (
                          <div style={{
                            flex: 1, height: 2, borderRadius: 1,
                            background: msCompleted
                              ? `linear-gradient(90deg, ${t.cyan}, ${t.violet})`
                              : t.border,
                          }} />
                        )}
                        <div style={{
                          width: isBoss ? 10 : 7,
                          height: isBoss ? 10 : 7,
                          borderRadius: '50%', flexShrink: 0,
                          background: msCompleted ? t.cyan : msActive ? t.violet : '#252530',
                          border: msActive ? `2px solid ${t.violet}` : 'none',
                          boxShadow: msActive ? `0 0 6px ${t.violet}50` : 'none',
                          animation: msActive ? 'pulse 2s ease-in-out infinite' : 'none',
                        }} />
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 2, background: '#252530', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`, height: '100%', borderRadius: 3,
                    background: isCompleted
                      ? `linear-gradient(90deg, ${t.gold}, ${t.cyan})`
                      : t.gradient,
                    transition: 'width 0.6s ease-out',
                  }} />
                </div>

                {/* Footer: active milestone + quest count */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 8,
                }}>
                  <p style={{
                    fontFamily: t.body, fontSize: 11, color: t.textMuted, margin: 0,
                  }}>
                    {isGenerating
                      ? 'Forging your quest line...'
                      : isCompleted
                        ? 'All milestones conquered!'
                        : activeMilestone
                          ? `Current milestone: ${activeMilestone.title}`
                          : 'Ready to begin'}
                  </p>
                  <span style={{
                    fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                    color: t.textMuted,
                  }}>
                    {completedQuests}/{totalQuests} quests
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
            );
          })}
        </div>
      )}
    </div>
  );
}
