'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmapStore, useOnboardingStore } from '@plan2skill/store';
import type { Roadmap, Milestone, Task, Rarity, MilestoneStatus, TaskStatus, TaskType, RoadmapStatus } from '@plan2skill/types';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t } from '../../(onboarding)/_components/tokens';
import { QuestLineCard } from './_components/QuestLineCard';

// ═══════════════════════════════════════════
// QUEST MAP HUB — BL-007
// Card grid of all roadmaps (replaces hardcoded PHASES[])
// Data: useRoadmapStore (server) with fallback to onboarding store (localStorage)
// ═══════════════════════════════════════════

// ─── Mock roadmap from onboarding data (pre-auth fallback) ──

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
    // First milestone active, first task available
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

export default function QuestMapPage() {
  const router = useRouter();
  const serverRoadmaps = useRoadmapStore((s) => s.roadmaps);
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);

  // Fallback: build mock roadmap from onboarding store when server data absent
  const { selectedGoals, dailyMinutes, aiEstimateWeeks } = useOnboardingStore();
  const roadmaps = useMemo<Roadmap[]>(() => {
    if (serverRoadmaps.length > 0) return serverRoadmaps;
    if (!selectedGoals.length) return [];
    const weeks = aiEstimateWeeks || 12;
    return selectedGoals.map((g) => buildMockRoadmap(g.label, g.id, weeks, dailyMinutes));
  }, [serverRoadmaps, selectedGoals, dailyMinutes, aiEstimateWeeks]);

  const hasCompleted = roadmaps.some((r) => r.status === 'completed');

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* ─── Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="compass" size={24} color="cyan" />
        Quest Map
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        marginBottom: 24,
      }}>
        Your quest lines, mapped and ready for adventure
      </p>

      {/* ─── Card Grid ─── */}
      {roadmaps.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {roadmaps.map((roadmap) => (
            <QuestLineCard
              key={roadmap.id}
              roadmap={roadmap}
              isActive={activeRoadmap?.id === roadmap.id}
              onClick={() => router.push(`/roadmap/${roadmap.id}`)}
            />
          ))}

          {/* +Add Quest Line — visible if ≥1 completed roadmap */}
          {hasCompleted && (
            <button
              onClick={() => router.push('/intent')}
              aria-label="Add a new quest line"
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: 24, borderRadius: 16,
                background: 'transparent',
                border: `2px dashed ${t.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: 140,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.violet;
                e.currentTarget.style.background = `${t.violet}06`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${t.violet}10`,
              }}>
                <NeonIcon type="plus" size={20} color="violet" />
              </div>
              <span style={{
                fontFamily: t.display, fontSize: 14, fontWeight: 700,
                color: t.textSecondary,
              }}>
                Add Quest Line
              </span>
            </button>
          )}
        </div>
      ) : (
        /* ─── Empty State ─── */
        <div style={{
          padding: 40, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <NeonIcon type="compass" size={40} color="muted" />
          </div>
          <p style={{
            fontFamily: t.display, fontSize: 16, fontWeight: 700,
            color: t.textMuted, marginBottom: 4,
          }}>
            No quest lines yet, hero!
          </p>
          <p style={{
            fontFamily: t.body, fontSize: 13, color: t.textMuted,
            marginBottom: 16,
          }}>
            Begin your journey by forging a quest line
          </p>
          <button
            onClick={() => router.push('/intent')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              background: t.gradient, border: 'none',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <NeonIcon type="fire" size={16} color="#FFF" />
            <span style={{
              fontFamily: t.display, fontSize: 14, fontWeight: 700, color: '#FFF',
            }}>
              Forge Quest Line
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
