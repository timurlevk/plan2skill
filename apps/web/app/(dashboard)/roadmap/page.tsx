'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmapStore, useOnboardingStore, useProgressionStore, useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import type { Roadmap, Milestone, Task, Rarity, MilestoneStatus, TaskStatus, TaskType, RoadmapStatus } from '@plan2skill/types';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';
import { t } from '../../(onboarding)/_components/tokens';
import { QuestLineCard } from './_components/QuestLineCard';
import type { QuestLineAction } from './_components/QuestLineCard';
import { RoadmapTierModal } from './_components/RoadmapTierModal';
import { TIER_LIMITS } from './_components/constants';

// ═══════════════════════════════════════════
// QUEST MAP HUB — BL-007 + Phase 5H
// Card grid of all roadmaps (replaces hardcoded PHASES[])
// Phase 5H: context menu actions, pause/resume, +Add Quest Line
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
      taskType: (['article', 'quiz', 'project', 'reflection', 'review'] as TaskType[])[j % 5]!,
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
  const tr = useI18nStore((s) => s.t);
  const serverRoadmaps = useRoadmapStore((s) => s.roadmaps);
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);
  const storePause = useRoadmapStore((s) => s.pauseRoadmap);
  const storeResume = useRoadmapStore((s) => s.resumeRoadmap);
  const storeArchive = useRoadmapStore((s) => s.archiveRoadmap);
  const storeReactivate = useRoadmapStore((s) => s.reactivateRoadmap);

  // tRPC mutations for pause/resume/archive/reactivate (background sync)
  const pauseMutation = trpc.roadmap.pause.useMutation();
  const resumeMutation = trpc.roadmap.resume.useMutation();
  const archiveMutation = trpc.roadmap.archive.useMutation();
  const reactivateMutation = trpc.roadmap.reactivate.useMutation();

  // SSR-safe reduced-motion hook (BLOCKER — Крок 9)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  // Fallback: build mock roadmap from onboarding store when server data absent
  const { selectedGoals, dailyMinutes, aiEstimateWeeks } = useOnboardingStore();
  const allRoadmaps = useMemo<Roadmap[]>(() => {
    if (serverRoadmaps.length > 0) return serverRoadmaps;
    if (!selectedGoals.length) return [];
    const weeks = aiEstimateWeeks || 12;
    return selectedGoals.map((g) => buildMockRoadmap(g.label, g.id, weeks, dailyMinutes));
  }, [serverRoadmaps, selectedGoals, dailyMinutes, aiEstimateWeeks]);

  const roadmaps = useMemo<Roadmap[]>(() => {
    if (activeTab === 'active') {
      return allRoadmaps.filter((r) => ['active', 'paused', 'generating'].includes(r.status));
    }
    return allRoadmaps.filter((r) => ['archived', 'completed'].includes(r.status));
  }, [allRoadmaps, activeTab]);

  // Count active (non-mock) roadmaps for premium gate
  const subscriptionTier = useProgressionStore((s) => s.subscriptionTier);
  const tierLimit = TIER_LIMITS[subscriptionTier] ?? 2;
  const activeCount = allRoadmaps.filter(
    (r) => !r.id.startsWith('mock-') && (r.status === 'active' || r.status === 'generating'),
  ).length;
  const [showTierModal, setShowTierModal] = useState(false);

  // Context menu action handler
  const handleAction = useCallback((action: QuestLineAction) => {
    switch (action.type) {
      case 'adjust':
        router.push(`/roadmap/${action.roadmapId}/adjust`);
        break;
      case 'pause':
        // Optimistic UI: update store immediately, sync in background
        storePause(action.roadmapId);
        pauseMutation.mutate(
          { roadmapId: action.roadmapId },
          {
            onError: (err) => {
              console.warn('[QuestMap] Pause sync failed:', err.message);
              storeResume(action.roadmapId); // Rollback
            },
          },
        );
        break;
      case 'resume':
        storeResume(action.roadmapId);
        resumeMutation.mutate(
          { roadmapId: action.roadmapId },
          {
            onError: (err) => {
              console.warn('[QuestMap] Resume sync failed:', err.message);
              storePause(action.roadmapId); // Rollback
            },
          },
        );
        break;
      case 'archive':
        setConfirmArchiveId(action.roadmapId);
        break;
      case 'reactivate':
        storeReactivate(action.roadmapId);
        reactivateMutation.mutate(
          { roadmapId: action.roadmapId },
          {
            onError: (err) => {
              console.warn('[QuestMap] Reactivate failed:', err.message);
              storeArchive(action.roadmapId);
              if (err.message.includes('Tier limit')) {
                setShowTierModal(true);
              }
            },
          },
        );
        break;
    }
  }, [router, storePause, storeResume, storeArchive, storeReactivate, pauseMutation, resumeMutation, archiveMutation, reactivateMutation]);

  // Confirm archive — performs the actual archive after user confirms
  const confirmArchive = useCallback(() => {
    if (!confirmArchiveId) return;
    // Capture previous status before optimistic update for proper rollback
    const targetRoadmap = allRoadmaps.find((r) => r.id === confirmArchiveId);
    const previousStatus = targetRoadmap?.status;
    storeArchive(confirmArchiveId);
    archiveMutation.mutate(
      { roadmapId: confirmArchiveId },
      {
        onError: (err) => {
          console.warn('[QuestMap] Archive sync failed:', err.message);
          // Rollback to the actual previous status, not always 'active'
          if (previousStatus === 'paused') {
            storePause(confirmArchiveId);
          } else {
            storeResume(confirmArchiveId);
          }
        },
      },
    );
    setConfirmArchiveId(null);
  }, [confirmArchiveId, allRoadmaps, storeArchive, storePause, storeResume, archiveMutation]);

  // "Add Quest Line" click handler — with tier gate
  const handleAddQuestLine = useCallback(() => {
    if (activeCount >= tierLimit) {
      setShowTierModal(true);
    } else {
      router.push('/roadmap/new');
    }
  }, [activeCount, tierLimit, router]);

  return (
    <div style={{ animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease-out' }}>
      {/* ─── Title ─── */}
      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.display, fontSize: 26, fontWeight: 900,
        color: t.text, marginBottom: 8,
      }}>
        <NeonIcon type="map" size={24} color="cyan" />
        {tr('questmap.title', 'Quest Map')}
      </h1>
      <p style={{
        fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        marginBottom: 24,
      }}>
        {tr('questmap.subtitle', 'Your quest lines, mapped and ready for adventure')}
      </p>

      {/* ─── Tab Bar ─── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        borderBottom: `1px solid ${t.border}`,
        paddingBottom: 0,
      }}>
        {(['active', 'history'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const count = tab === 'active'
            ? allRoadmaps.filter((r) => ['active', 'paused', 'generating'].includes(r.status)).length
            : allRoadmaps.filter((r) => ['archived', 'completed'].includes(r.status)).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                fontFamily: t.display, fontSize: 13, fontWeight: isSelected ? 700 : 500,
                color: isSelected ? t.violet : t.textMuted,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isSelected ? t.violet : 'transparent'}`,
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
                marginBottom: -1,
              }}
            >
              {tab === 'active' ? tr('roadmap.tab_active', 'Active') : tr('roadmap.tab_history', 'History')}
              {count > 0 && (
                <span style={{
                  marginLeft: 6, padding: '1px 6px', borderRadius: 8,
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  background: isSelected ? `${t.violet}15` : `${t.textMuted}15`,
                  color: isSelected ? t.violet : t.textMuted,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Card Grid ─── */}
      {roadmaps.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {roadmaps.map((roadmap, index) => (
            <div
              key={roadmap.id}
              style={{
                animationDelay: reducedMotion ? '0s' : `${index * 0.08}s`,
                animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease-out both',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                borderRadius: 16,
              }}
            >
              <QuestLineCard
                roadmap={roadmap}
                isActive={activeRoadmap?.id === roadmap.id}
                onClick={() => router.push(`/roadmap/${roadmap.id}`)}
                onAction={handleAction}
              />
            </div>
          ))}

          {/* +Add Quest Line — only on Active tab */}
          {activeTab === 'active' && (
            <button
              onClick={handleAddQuestLine}
              aria-label="Add a new quest line"
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: 24, borderRadius: 16,
                background: 'transparent',
                border: `2px dashed ${t.border}`,
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, background 0.2s ease',
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
                {tr('questmap.add', 'Add Quest Line')}
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 10, fontWeight: 600,
                color: activeCount >= tierLimit ? t.rose : t.textMuted,
              }}>
                {tr('questmap.count', '{n}/{limit} quest lines').replace('{n}', String(activeCount)).replace('{limit}', String(tierLimit))}
              </span>
            </button>
          )}
        </div>
      ) : activeTab === 'history' ? (
        /* ─── History Empty State ─── */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, padding: '48px 0',
        }}>
          <NeonIcon type="book" size={32} color={t.textMuted} />
          <p style={{
            fontFamily: t.body, fontSize: 14, color: t.textMuted, textAlign: 'center',
          }}>
            {tr('roadmap.history_empty', 'No archived or completed quest lines yet')}
          </p>
        </div>
      ) : (
        /* ─── Empty State ─── */
        <div style={{
          padding: 40, borderRadius: 16,
          background: t.bgCard, border: `1px solid ${t.border}`,
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 12,
            animation: reducedMotion ? 'none' : 'float 3s ease-in-out infinite',
          }}>
            <NeonIcon type="map" size={40} color="muted" />
          </div>
          <p style={{
            fontFamily: t.display, fontSize: 16, fontWeight: 700,
            color: t.textMuted, marginBottom: 4,
          }}>
            {tr('questmap.empty_title', 'No quest lines yet, hero!')}
          </p>
          <p style={{
            fontFamily: t.body, fontSize: 13, color: t.textMuted,
            marginBottom: 16,
          }}>
            {tr('questmap.empty_desc', 'Begin your journey by forging a quest line')}
          </p>
          <button
            onClick={() => router.push('/intent')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              background: t.gradient, border: 'none',
              cursor: 'pointer', transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <NeonIcon type="fire" size={16} color="#FFF" />
            <span style={{
              fontFamily: t.display, fontSize: 14, fontWeight: 700, color: '#FFF',
            }}>
              {tr('questmap.forge', 'Forge Quest Line')}
            </span>
          </button>
        </div>
      )}

      {/* Tier gate modal */}
      {showTierModal && (
        <RoadmapTierModal
          isOpen
          onClose={() => setShowTierModal(false)}
          tierInfo={{ tier: subscriptionTier, current: activeCount, limit: tierLimit }}
        />
      )}

      {/* Archive confirmation modal */}
      {confirmArchiveId !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmArchiveId(null); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setConfirmArchiveId(null); }}
          tabIndex={-1}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tr('roadmap.archive_confirm_title', 'Deactivate Quest Line?')}
            style={{
              maxWidth: 400, width: '90vw',
              padding: 28, borderRadius: 20,
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${t.violet}10`,
              animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
            }}
          >
            {/* Icon */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: `${t.rose}12`,
                border: `1px solid ${t.rose}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <NeonIcon type="book" size={28} color="rose" />
              </div>
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: t.display, fontSize: 20, fontWeight: 900,
              color: t.text, textAlign: 'center', marginBottom: 8,
            }}>
              {tr('roadmap.archive_confirm_title', 'Deactivate Quest Line?')}
            </h2>

            {/* Body */}
            <p style={{
              fontFamily: t.body, fontSize: 14, color: t.textSecondary,
              textAlign: 'center', marginBottom: 24, lineHeight: 1.5,
            }}>
              {tr('roadmap.archive_confirm_body', 'You can restore it from History. All progress is saved.')}
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                autoFocus
                onClick={() => setConfirmArchiveId(null)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 12,
                  background: 'transparent',
                  border: `1px solid ${t.border}`,
                  cursor: 'pointer',
                  fontFamily: t.display, fontSize: 14, fontWeight: 700,
                  color: t.textSecondary,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${t.textMuted}10`; e.currentTarget.style.borderColor = t.borderHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = t.border; }}
              >
                {tr('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={confirmArchive}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 12,
                  background: `${t.rose}15`,
                  border: `1px solid ${t.rose}30`,
                  cursor: 'pointer',
                  fontFamily: t.display, fontSize: 14, fontWeight: 700,
                  color: t.rose,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${t.rose}25`; e.currentTarget.style.borderColor = `${t.rose}50`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${t.rose}15`; e.currentTarget.style.borderColor = `${t.rose}30`; }}
              >
                {tr('roadmap.archive_confirm_action', 'Deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
