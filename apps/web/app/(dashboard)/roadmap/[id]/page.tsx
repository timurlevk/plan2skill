'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRoadmapStore } from '@plan2skill/store';
import { useOnboardingStore, useProgressionStore } from '@plan2skill/store';
import type { Roadmap, Milestone, Task, Rarity, MilestoneStatus, TaskStatus, TaskType, RoadmapStatus } from '@plan2skill/types';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { charArtStrings, charPalettes } from '../../../(onboarding)/_components/characters';
import { parseArt, AnimatedPixelCanvas } from '../../../(onboarding)/_components/PixelEngine';
import { TrophyShelf } from '../_components/TrophyShelf';
import { TimelineNode } from '../_components/TimelineNode';
import { MilestoneDetail } from '../_components/MilestoneDetail';
import { CompletionCelebration } from '../_components/CompletionCelebration';
import { WhatsNextScreen } from '../_components/WhatsNextScreen';
import { useRoadmapCompletion } from '../_hooks/useRoadmapCompletion';

// ═══════════════════════════════════════════
// TIMELINE DRILL-DOWN — BL-007
// Horizontal timeline with trophy shelf, character on active node,
// snap scrolling, and milestone detail panel
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

export default function TimelineDrillDownPage() {
  const params = useParams();
  const roadmapId = params.id as string;

  // Data from store (hydrated by useServerHydration)
  const storeRoadmap = useRoadmapStore((s) =>
    s.roadmaps.find((r) => r.id === roadmapId) ?? null,
  );

  // Fallback: build mock roadmap from onboarding store when server data absent
  const { selectedGoals, dailyMinutes, aiEstimateWeeks } = useOnboardingStore();
  const roadmap = useMemo<Roadmap | null>(() => {
    if (storeRoadmap) return storeRoadmap;
    // Try to find matching goal from mock roadmap ID pattern: mock-roadmap-{goalId}
    if (roadmapId.startsWith('mock-roadmap-') && selectedGoals.length > 0) {
      const goalId = roadmapId.replace('mock-roadmap-', '');
      const goal = selectedGoals.find((g) => g.id === goalId);
      if (goal) {
        const weeks = aiEstimateWeeks || 12;
        return buildMockRoadmap(goal.label, goal.id, weeks, dailyMinutes);
      }
    }
    return null;
  }, [storeRoadmap, roadmapId, selectedGoals, dailyMinutes, aiEstimateWeeks]);
  const unlockedAchievements = useProgressionStore((s) => s.unlockedAchievements);

  // Character data for active-node avatar
  const characterId = useOnboardingStore((s) => s.characterId);
  const charData = useMemo(() => {
    if (!characterId || !charArtStrings[characterId] || !charPalettes[characterId]) return null;
    return {
      id: characterId,
      artString: charArtStrings[characterId]!,
      palette: charPalettes[characterId]!,
      art: parseArt(charArtStrings[characterId]!, charPalettes[characterId]!),
    };
  }, [characterId]);

  // BL-008: Completion flow
  const completion = useRoadmapCompletion();
  const completionFiredRef = useRef(false);

  // Selected milestone for detail panel
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Auto-scroll to active milestone
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevActiveRef = useRef<number>(-1);

  const milestones = roadmap?.milestones ?? [];
  const activeIndex = milestones.findIndex((m) => m.status === 'active');

  // Auto-select active milestone on mount
  useEffect(() => {
    if (activeIndex >= 0 && selectedIndex === null) {
      setSelectedIndex(activeIndex);
    }
  }, [activeIndex, selectedIndex]);

  // Auto-scroll to active node on mount or when active changes
  useEffect(() => {
    if (activeIndex < 0) return;
    if (prevActiveRef.current === activeIndex) return;
    prevActiveRef.current = activeIndex;

    const node = nodeRefs.current[activeIndex];
    if (node) {
      requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    }
  }, [activeIndex]);

  // BL-008: Fire completion when roadmap reaches 100%
  useEffect(() => {
    if (roadmap && roadmap.progress >= 100 && roadmap.status === 'completed' && !completionFiredRef.current && completion.isIdle) {
      completionFiredRef.current = true;
      completion.send({ type: 'ROADMAP_COMPLETE', roadmapId: roadmap.id });
    }
  }, [roadmap, completion]);

  // Loading / not found
  if (!roadmap) {
    return (
      <div style={{
        padding: 40, textAlign: 'center',
        animation: 'fadeUp 0.5s ease-out',
      }}>
        <NeonIcon type="compass" size={40} color="muted" />
        <p style={{
          fontFamily: t.display, fontSize: 16, fontWeight: 700,
          color: t.textMuted, marginTop: 12,
        }}>
          Quest line not found
        </p>
        <Link href="/roadmap" style={{
          fontFamily: t.body, fontSize: 13, color: t.violet,
          textDecoration: 'none',
        }}>
          Return to Quest Map
        </Link>
      </div>
    );
  }

  const selectedMilestone = selectedIndex !== null ? milestones[selectedIndex] : null;
  const isCompleted = roadmap.status === 'completed';

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      {/* ─── Back link ─── */}
      <Link
        href="/roadmap"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: t.body, fontSize: 13, fontWeight: 600,
          color: t.textSecondary, textDecoration: 'none',
          marginBottom: 16, transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = t.violet; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = t.textSecondary; }}
      >
        <span style={{ fontSize: 14, color: t.textMuted }}>←</span>
        Quest Map
      </Link>

      {/* ─── Title ─── */}
      <h1 style={{
        fontFamily: t.display, fontSize: 24, fontWeight: 900,
        color: t.text, marginBottom: 6,
      }}>
        {roadmap.title}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 13, color: t.textSecondary,
        marginBottom: 20,
      }}>
        {roadmap.description || roadmap.goal}
      </p>

      {/* ─── Overall Progress Bar ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
      }}>
        <div style={{
          flex: 1, height: 6, borderRadius: 3,
          background: '#252530', overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.round(roadmap.progress)}%`,
            height: '100%', borderRadius: 3,
            background: isCompleted
              ? `linear-gradient(90deg, ${t.gold}, ${t.cyan})`
              : t.gradient,
            transition: 'width 0.8s ease-out',
            boxShadow: roadmap.progress > 85 ? `0 0 8px ${t.violet}60` : `0 0 4px ${t.violet}30`,
          }} />
        </div>
        <span style={{
          fontFamily: t.mono, fontSize: 14, fontWeight: 800,
          color: isCompleted ? t.gold : t.cyan,
        }}>
          {Math.round(roadmap.progress)}%
        </span>
      </div>

      {/* ─── Trophy Shelf ─── */}
      <TrophyShelf milestones={milestones} unlockedAchievements={unlockedAchievements} />

      {/* ─── Horizontal Timeline ─── */}
      <div
        ref={scrollContainerRef}
        style={{
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: '16px 0',
          position: 'relative',
          // Peek edges for scroll affordance
          maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}
      >
        {/* Gradient connecting line */}
        <div style={{
          position: 'absolute',
          top: '50%', left: 40, right: 40,
          height: 2, borderRadius: 1,
          transform: 'translateY(-15px)',
          background: `linear-gradient(90deg, ${t.violet}60, ${t.cyan}40, ${t.border})`,
          zIndex: 0,
        }} />

        {/* Nodes container */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          gap: 8, padding: '0 20px',
          position: 'relative', zIndex: 1,
        }}>
          {milestones.map((ms, i) => (
            <div
              key={ms.id}
              ref={(el) => { nodeRefs.current[i] = el; }}
              style={{ position: 'relative' }}
            >
              {/* Character on active node */}
              {i === activeIndex && charData && (
                <div style={{
                  position: 'absolute',
                  top: -52,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  animation: 'float 3s ease-in-out infinite',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}>
                  <AnimatedPixelCanvas
                    character={charData}
                    size={2}
                    glowColor={t.violet}
                  />
                </div>
              )}

              <TimelineNode
                milestone={ms}
                index={i}
                totalCount={milestones.length}
                isSelected={selectedIndex === i}
                onClick={() => setSelectedIndex(i)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── Milestone Detail Panel ─── */}
      {selectedMilestone && (
        <div style={{ marginTop: 16 }}>
          <MilestoneDetail
            key={selectedMilestone.id}
            milestone={selectedMilestone}
            isActive={selectedMilestone.status === 'active'}
          />
        </div>
      )}

      {/* ─── BL-008: Completion Overlays ─── */}
      {completion.isCelebrating && (
        <CompletionCelebration
          stats={completion.stats}
          isTrophyClaim={completion.state.matches('trophyClaim')}
          onSkip={() => completion.send({ type: 'SKIP' })}
          onClaimTrophy={() => completion.send({ type: 'CLAIM_TROPHY' })}
        />
      )}

      {completion.isWhatsNext && (
        <WhatsNextScreen
          overdueReviewCount={completion.overdueReviewCount}
          trending={completion.trending as any[]}
          onSelectOption={(option) => {
            completion.send({ type: 'SELECT_OPTION', option });
            completion.send({ type: 'CONFIRM' });
          }}
        />
      )}
    </div>
  );
}
