'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useOnboardingStore, useOnboardingV2Store, useProgressionStore, useCharacterStore, useSocialStore, useRoadmapStore, useI18nStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { t } from '../../(onboarding)/_components/tokens';
import { CHARACTERS } from '../../(onboarding)/_components/characters';
import { ARCHETYPES } from '../../(onboarding)/_data/archetypes';
import type { QuestTask } from './_utils/quest-templates';
import { useQuestEngine } from './_hooks/useQuestEngine';
import { useQuestSystem } from './_hooks/useQuestSystem';
import { useDailyProgress } from './_hooks/useDailyProgress';
import { useServerHydration } from './_hooks/useServerHydration';
import { QuestJourneyModal } from './_components/quest-journey/QuestJourneyModal';
import { StatsRow } from './_components/StatsRow';
import { QuestLines } from './_components/QuestLines';
import { RoadmapCards } from './_components/RoadmapCards';
import { DailyQuests } from './_components/DailyQuests';
import { TrainingGrounds } from './_components/TrainingGrounds';
import { ReviewModal } from './_components/ReviewModal';
import { ContinueQuestHero, getDaysSince } from './_components/ContinueQuestHero';
import { AchievementToast } from './_components/AchievementToast';
import { SkeletonLoader } from './_components/SkeletonLoader';
import { SocialCards } from './_components/SocialCards';
import { WeeklyChallenges } from './_components/WeeklyChallenges';
import { QuestError } from './_components/QuestError';
import { AttributeWidget } from './_components/AttributeWidget';
import { DailyEpisodeCard } from './_components/DailyEpisodeCard';
import { useWeeklyChallenges } from './_hooks/useWeeklyChallenges';
import { useSpacedRepetition } from './_hooks/useSpacedRepetition';
import { useRoadmapProgress } from './_hooks/useRoadmapProgress';
import { MasteryRing } from './_components/MasteryRing';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════
// LEVEL-UP CELEBRATION — Macro animation (§3 Reward sequences)
// Auto-dismiss 2500ms, tap-to-skip, reduced-motion safe
// ═══════════════════════════════════════════

const CONFETTI_COLORS = [t.violet, t.cyan, t.rose, t.gold, '#6EE7B7', '#818CF8', '#E879F9', '#FFD166'];

function LevelUpCelebration({ newLevel, onDismiss }: { newLevel: number; onDismiss: () => void }) {
  const tr = useI18nStore((s) => s.t);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const timer = setTimeout(onDismiss, reducedMotion ? 1000 : 2500);
    return () => clearTimeout(timer);
  }, [onDismiss, reducedMotion]);

  return (
    <div
      onClick={onDismiss}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(circle, rgba(157,122,255,0.3), rgba(12,12,16,0.9))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        animation: reducedMotion ? 'none' : 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Confetti particles — hidden in reduced motion */}
      {!reducedMotion && Array.from({ length: 8 }, (_, i) => {
        const left = 10 + (i * 11);
        const delay = i * 0.15;
        const size = 5 + (i % 3) * 3;
        const isSquare = i % 3 === 0;
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: size,
              height: isSquare ? size : size * 0.4,
              borderRadius: isSquare ? 2 : size,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              top: -10,
              left: `${left}%`,
              animation: `confettiFall 2s ease-in ${delay}s forwards`,
              opacity: 0.9,
            }}
          />
        );
      })}

      {/* "ASCENSION!" text */}
      <div style={{
        fontFamily: t.display, fontSize: 36, fontWeight: 900,
        color: '#FFD166', textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        textShadow: '0 0 20px rgba(255,209,102,0.5)',
        animation: reducedMotion ? 'none' : 'celebratePop 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        marginBottom: 16,
      }}>
        {tr('dashboard.levelup_title', 'Ascension!')}
      </div>

      {/* New level number */}
      <div style={{
        fontFamily: t.display, fontSize: 64, fontWeight: 900,
        color: t.text,
        animation: reducedMotion ? 'none' : 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
      }}>
        {tr('dashboard.levelup_level', 'Level {level}').replace('{level}', String(newLevel))}
      </div>

      {/* Tap to skip hint */}
      <div style={{
        fontFamily: t.body, fontSize: 12, color: t.textMuted,
        marginTop: 24,
        animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease-out 0.6s both',
      }}>
        {tr('dashboard.levelup_tap', 'Tap anywhere to continue')}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// STREAK MILESTONE CELEBRATION — Meso animation
// Milestones: 7, 30, 100, 365
// ═══════════════════════════════════════════

function StreakMilestoneCelebration({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const tr = useI18nStore((s) => s.t);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STREAK_MILESTONE_KEYS: Record<number, [string, string]> = {
    7: ['dashboard.streak_7', '7-Day Streak!'],
    30: ['dashboard.streak_30', '30-Day Legend!'],
    100: ['dashboard.streak_100', '100-Day Master!'],
    365: ['dashboard.streak_365', '365-Day Immortal!'],
  };
  const milestone = STREAK_MILESTONE_KEYS[streak];
  const label = milestone ? tr(milestone[0], milestone[1]) : `${streak}-Day Streak!`;

  useEffect(() => {
    const timer = setTimeout(onDismiss, reducedMotion ? 800 : 2000);
    return () => clearTimeout(timer);
  }, [onDismiss, reducedMotion]);

  return (
    <div
      onClick={onDismiss}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'radial-gradient(circle, rgba(251,191,36,0.2), rgba(12,12,16,0.85))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        animation: reducedMotion ? 'none' : 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Mini confetti — 4-6 particles */}
      {!reducedMotion && Array.from({ length: 5 }, (_, i) => {
        const left = 15 + (i * 17);
        const delay = i * 0.2;
        const size = 4 + (i % 3) * 2;
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: size,
              height: size * 0.5,
              borderRadius: size,
              background: [t.gold, t.rose, t.cyan, t.violet, '#6EE7B7'][i % 5],
              top: -10,
              left: `${left}%`,
              animation: `confettiFall 2s ease-in ${delay}s forwards`,
              opacity: 0.85,
            }}
          />
        );
      })}

      {/* Fire emoji */}
      <div style={{
        fontSize: 48, marginBottom: 12,
        animation: reducedMotion ? 'none' : 'celebratePop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        &#128293;
      </div>

      {/* Milestone text */}
      <div style={{
        fontFamily: t.display, fontSize: 28, fontWeight: 900,
        color: t.gold, textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        textShadow: '0 0 16px rgba(251,191,36,0.4)',
        animation: reducedMotion ? 'none' : 'celebratePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
      }}>
        {label}
      </div>

      {/* Tap to skip */}
      <div style={{
        fontFamily: t.body, fontSize: 12, color: t.textMuted,
        marginTop: 16,
        animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out 0.4s both',
      }}>
        {tr('dashboard.tap_dismiss', 'Tap to continue')}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// QUEST MODAL BRIDGE — Renders Journey modal for rich
// Always uses QuestJourneyModal (backward-compatible with articleBody/quizQuestions)
// ═══════════════════════════════════════════

function QuestModalBridge({
  openTask,
  openQuestId,
  engine,
  getNextQuest,
  setOpenQuestId,
  characterId,
  dailyCompleted,
  dailyTotal,
  currentStreak,
  energyCrystals,
  consumeCrystal,
  reviewMode = false,
}: {
  openTask: QuestTask;
  openQuestId: string | null;
  engine: ReturnType<typeof useQuestEngine>;
  getNextQuest: (currentId: string | null) => string | null;
  setOpenQuestId: (id: string | null) => void;
  characterId: string | null;
  dailyCompleted: number;
  dailyTotal: number;
  currentStreak: number;
  energyCrystals: number;
  consumeCrystal: () => void;
  reviewMode?: boolean;
}) {
  return (
    <QuestJourneyModal
      key={openTask.id}
      task={openTask}
      done={engine.completedQuests.has(openTask.id)}
      reviewMode={reviewMode}
      onClose={() => setOpenQuestId(null)}
      onToggle={() => {
        if (engine.completedQuests.has(openTask.id)) {
          engine.undoQuest(openTask.id, openTask.xp);
        } else {
          engine.completeQuest(openTask.id, openTask.goalLabel, openTask.xp);
        }
      }}
      onOpenNext={(() => {
        const nextId = getNextQuest(openQuestId);
        if (!nextId) return null;
        return () => setOpenQuestId(nextId);
      })()}
      characterId={characterId}
      dailyCompleted={dailyCompleted}
      dailyTotal={dailyTotal}
      bonusResult={engine.bonusResults.get(openTask.id) || null}
      currentStreak={currentStreak}
      energyCrystals={energyCrystals}
      onConsumeCrystal={consumeCrystal}
      attributeGrowth={engine.lastAttributeGrowth}
    />
  );
}

// ═══════════════════════════════════════════
// COMMAND CENTER — Dashboard home page orchestrator
// ═══════════════════════════════════════════

export default function HomePage() {
  const tr = useI18nStore((s) => s.t);
  const { selectedGoals, skillAssessments } = useOnboardingStore();
  const { onboardingCompletedAt } = useOnboardingV2Store();
  const { totalXp, level, currentStreak, coins, energyCrystals, maxEnergyCrystals,
    lastActivityDate, quietMode, consumeCrystal } = useProgressionStore();

  // Character identity — from character store (hydrated from DB by useServerHydration)
  const dbCharacterId = useCharacterStore((s) => s.characterId);
  const dbArchetypeId = useCharacterStore((s) => s.archetypeId);
  // Fallback to onboarding store for fresh onboarding (before hydration completes)
  const obCharacterId = useOnboardingStore((s) => s.characterId);
  const obArchetypeId = useOnboardingStore((s) => s.archetypeId);
  const characterId = dbCharacterId || obCharacterId;
  const archetypeId = dbArchetypeId || obArchetypeId;

  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;
  const displayName = useSocialStore((s) => s.displayName);

  // Hydration guard — show skeleton until store rehydrates
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Server hydration — sync progression from backend on load
  const { isHydrating, isHydrationError, erroredQueries } = useServerHydration();

  // Energy recharge mutation
  const rechargeMutation = trpc.progression.rechargeEnergy.useMutation();
  const handleRechargeEnergy = useCallback(() => {
    useProgressionStore.getState().rechargeCrystals();
    rechargeMutation.mutate(undefined, {
      onError: () => console.warn('[rechargeEnergy] failed'),
    });
  }, [rechargeMutation]);

  // Quest engine — persistence pipeline
  const engine = useQuestEngine();

  // Phase W1: Server quest system — real quests only (no mock fallback)
  const questSystem = useQuestSystem();
  const roadmaps = useRoadmapStore((s) => s.roadmaps);

  // tRPC utils for manual refetch
  const utils = trpc.useUtils();

  // SSE-based roadmap generation progress (real-time updates from backend)
  const roadmapProgress = useRoadmapProgress(() => {
    // On generation complete → refetch quests + roadmaps
    questSystem.refetchQuests();
    (utils.roadmap.list.fetch() as Promise<unknown>).then((fresh) => {
      if (fresh && Array.isArray(fresh)) {
        useRoadmapStore.getState().setRoadmaps(fresh as any);
        const active = (fresh as any[]).find((r: any) => r.status === 'active');
        useRoadmapStore.getState().setActiveRoadmap(active ?? null);
      }
    }).catch((err) => console.warn('[Dashboard] roadmap refresh failed:', err));
  });
  const isRoadmapGenerating = roadmapProgress.isGenerating || roadmaps.some((r) => r.status === 'generating');

  // Weekly challenges (Phase 5E)
  const weekly = useWeeklyChallenges();

  // Spaced repetition mastery (Phase 5D)
  const mastery = useSpacedRepetition();

  // Quest groups: server quests only, empty array if none available
  const questGroups = questSystem.serverQuestGroups ?? [];

  // Daily progress (derived state)
  const { dailyTotal, dailyCompleted, allTasks, getNextQuest } =
    useDailyProgress(questGroups, engine.completedQuests);

  // BL-001: First visit detection — onboarding done but never visited dashboard
  const isFirstVisit = !!onboardingCompletedAt && !lastActivityDate;

  // BL-001: Set lastActivityDate on first dashboard render (prevents repeat first-visit)
  useEffect(() => {
    if (hydrated && isFirstVisit) {
      useProgressionStore.getState().updateStreak();
    }
  }, [hydrated, isFirstVisit]);

  // Warm-up quest — auto-select easiest uncompleted quest (UX-R100)
  const daysAbsent = getDaysSince(lastActivityDate);
  const warmupQuest = useMemo(() => {
    // Find first uncompleted task, prefer common rarity (easiest)
    for (const { tasks } of questGroups) {
      const common = tasks.find(tk =>
        !engine.completedQuests.has(tk.id) && tk.rarity === 'common'
      );
      if (common) return common;
    }
    // Fallback: any uncompleted task
    for (const { tasks } of questGroups) {
      const any = tasks.find(tk => !engine.completedQuests.has(tk.id));
      if (any) return any;
    }
    return null;
  }, [questGroups, engine.completedQuests]);

  // Ref for "Choose a different quest" scroll target
  const dailyQuestsRef = useRef<HTMLDivElement>(null);
  const scrollToDailyQuests = useCallback(() => {
    dailyQuestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Modal state
  const [openQuestId, setOpenQuestId] = useState<string | null>(null);
  const [questReviewMode, setQuestReviewMode] = useState(false);
  const openTask = openQuestId ? allTasks.get(openQuestId) : null;

  // Review modal state (Training Grounds)
  const [reviewSkillId, setReviewSkillId] = useState<string | null>(null);
  const handleStartReview = useCallback((skillId: string) => {
    setReviewSkillId(skillId);
  }, []);
  const handleSubmitReview = useCallback(async (quality: number) => {
    if (!reviewSkillId) return;
    await mastery.submitReview(reviewSkillId, quality);
    setReviewSkillId(null);
  }, [reviewSkillId, mastery]);

  // ─── Level-up celebration detection ───
  const prevLevelRef = useRef<number | null>(null);
  const [levelUpDisplay, setLevelUpDisplay] = useState<number | null>(null);
  useEffect(() => {
    if (prevLevelRef.current === null) {
      prevLevelRef.current = level;
      return;
    }
    if (level > prevLevelRef.current) {
      setLevelUpDisplay(level);
    }
    prevLevelRef.current = level;
  }, [level]);

  // ─── Streak milestone celebration detection ───
  const prevStreakRef = useRef<number | null>(null);
  const [streakMilestoneDisplay, setStreakMilestoneDisplay] = useState<number | null>(null);
  useEffect(() => {
    const milestones = [7, 30, 100, 365];
    if (prevStreakRef.current === null) {
      prevStreakRef.current = currentStreak;
      return;
    }
    if (
      milestones.includes(currentStreak) &&
      currentStreak > prevStreakRef.current
    ) {
      setStreakMilestoneDisplay(currentStreak);
    }
    prevStreakRef.current = currentStreak;
  }, [currentStreak]);

  if (!hydrated || isHydrating) return <SkeletonLoader />;

  return (
    <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
      {/* Hydration error banner — non-fatal, partial data still renders */}
      {isHydrationError && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: `${t.rose}12`, border: `1px solid ${t.rose}30`,
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        }}>
          <NeonIcon type="blocked" size={16} color="rose" />
          <span style={{ fontFamily: t.body, fontSize: 13, color: t.rose }}>
            {tr('dashboard.load_error', 'Some data failed to load. Pull to refresh.')}
          </span>
        </div>
      )}

      {/* Quest Modal — Journey modal for rich content, legacy for plain quests */}
      {openTask && (
        <QuestModalBridge
          openTask={openTask}
          openQuestId={openQuestId}
          engine={engine}
          getNextQuest={getNextQuest}
          setOpenQuestId={(id) => { setOpenQuestId(id); if (!id) setQuestReviewMode(false); }}
          characterId={characterId}
          dailyCompleted={dailyCompleted}
          dailyTotal={dailyTotal}
          currentStreak={currentStreak}
          energyCrystals={energyCrystals}
          consumeCrystal={consumeCrystal}
          reviewMode={questReviewMode}
        />
      )}

      {/* Review Modal (Training Grounds) */}
      {reviewSkillId && (() => {
        const skill = mastery.skills.find((s: { skillId: string }) => s.skillId === reviewSkillId);
        if (!skill) return null;
        return (
          <ReviewModal
            skillDomain={skill.skillDomain}
            masteryLevel={skill.masteryLevel}
            onSubmit={handleSubmitReview}
            onClose={() => setReviewSkillId(null)}
            isSubmitting={mastery.isSubmitting}
          />
        );
      })()}

      {/* Achievement Toast */}
      <AchievementToast
        achievement={engine.newlyUnlockedAchievements[0] || null}
        onDismiss={engine.dismissAchievement}
      />

      {/* Level-Up Celebration — Macro animation, tap-to-skip (UX-R164) */}
      {levelUpDisplay !== null && (
        <LevelUpCelebration
          newLevel={levelUpDisplay}
          onDismiss={() => setLevelUpDisplay(null)}
        />
      )}

      {/* Streak Milestone Celebration — Meso animation */}
      {streakMilestoneDisplay !== null && (
        <StreakMilestoneCelebration
          streak={streakMilestoneDisplay}
          onDismiss={() => setStreakMilestoneDisplay(null)}
        />
      )}

      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: t.display, fontSize: 26, fontWeight: 900,
          color: t.text, marginBottom: 6, lineHeight: 1.3,
        }}>
          {tr('dashboard.greeting', '{name}, let\'s get going!').replace('{name}', displayName || charMeta?.name || 'Hero')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: t.body, fontSize: 14, color: t.textSecondary }}>
            {tr('dashboard.todays_focus', "Today's focus: Level up your skills")}
          </span>
          {archetype && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 10px', borderRadius: 20,
              background: `${archetype.color}12`, border: `1px solid ${archetype.color}25`,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700, color: archetype.color,
            }}>
              {archetype.icon} {archetypeId ? tr(`archetype.${archetypeId}`, archetype.name) : archetype.name}
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <StatsRow
        level={level}
        currentStreak={currentStreak}
        totalXp={totalXp}
        coins={coins}
        energyCrystals={energyCrystals}
        maxEnergyCrystals={maxEnergyCrystals}
        onRechargeEnergy={handleRechargeEnergy}
        isRecharging={rechargeMutation.isPending}
      />

      {/* Phase 5H: Attribute Widget — inline on mobile, hidden on desktop (shown in sidebar) */}
      <div className="sidebar-content-inline" style={{ marginBottom: 16 }}>
        <AttributeWidget />
      </div>

      {/* Zone 1: Continue Quest Hero CTA */}
      {!isRoadmapGenerating && questGroups.length > 0 && (
        <ContinueQuestHero
          nextQuest={warmupQuest}
          allDone={dailyCompleted >= dailyTotal && dailyTotal > 0}
          dailyCompleted={dailyCompleted}
          dailyTotal={dailyTotal}
          onStartQuest={setOpenQuestId}
          daysAbsent={daysAbsent}
          isFirstVisit={isFirstVisit}
        />
      )}

      {/* Zone 2: Roadmap Cards — horizontal summary */}
      <RoadmapCards
        selectedGoals={selectedGoals}
        skillAssessments={skillAssessments}
      />

      {/* Daily Episode — narrative system (Phase P) */}
      <DailyEpisodeCard />

      {/* Today's Quests — BL-004: moved up as PRIMARY ACTION */}
      <div ref={dailyQuestsRef} />

      {/* AI Generating State — SSE real-time progress from backend */}
      {(isRoadmapGenerating || questSystem.isGeneratingQuests) && questGroups.length === 0 && (() => {
        const pct = roadmapProgress.progress.percent;
        const msg = roadmapProgress.progress.message;
        const milestones = roadmapProgress.progress.milestones;
        const phase = roadmapProgress.progress.phase;
        return (
          <div style={{
            padding: '24px 20px', borderRadius: 16,
            background: t.bgCard, border: `1px solid ${t.violet}20`,
            marginBottom: 24, animation: 'fadeUp 0.4s ease-out',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${t.violet}15`, border: `1px solid ${t.violet}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                <NeonIcon type="compass" size={20} color="violet" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 2,
                }}>
                  {tr('dashboard.ai_generating', 'Crafting your quest line...')}
                </div>
                <div style={{ fontFamily: t.body, fontSize: 12, color: t.textSecondary }}>
                  {msg || tr('dashboard.ai_generating_sub', 'AI is building personalized quests based on your goals')}
                </div>
              </div>
              {/* Percent badge */}
              {pct > 0 && (
                <span style={{
                  fontFamily: t.mono, fontSize: 12, fontWeight: 800,
                  color: t.violet, padding: '4px 10px', borderRadius: 10,
                  background: `${t.violet}12`, flexShrink: 0,
                }}>
                  {pct}%
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div style={{
              height: 6, borderRadius: 3, background: t.border,
              overflow: 'hidden', marginBottom: 16,
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: t.gradient,
                width: `${Math.max(pct, 5)}%`,
                transition: 'width 0.6s ease-out',
                boxShadow: pct > 50 ? `0 0 8px ${t.violet}60` : 'none',
              }} />
            </div>

            {/* Milestones — revealed as they arrive from SSE */}
            {milestones.length > 0 ? (
              milestones.map((ms, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12,
                  background: t.bgElevated, border: `1px solid ${t.border}`,
                  marginBottom: i < milestones.length - 1 ? 6 : 0,
                  animation: `fadeUp 0.3s ease-out ${i * 0.08}s both`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `${t.cyan}15`, border: `1px solid ${t.cyan}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <NeonIcon type="check" size={12} color="cyan" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: t.display, fontSize: 12, fontWeight: 700,
                      color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {ms.title}
                    </div>
                    <div style={{ fontFamily: t.mono, fontSize: 10, color: t.textMuted }}>
                      {ms.taskCount} quests
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Skeleton cards — shown before milestones arrive */
              [0, 1, 2].map((i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: t.bgElevated, border: `1px solid ${t.border}`,
                  marginBottom: i < 2 ? 6 : 0,
                  animation: `fadeUp 0.4s ease-out ${0.1 + i * 0.1}s both`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(90deg, ${t.border} 25%, ${t.bgCard} 50%, ${t.border} 75%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s linear infinite',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      width: `${60 + i * 12}%`, height: 12, borderRadius: 6, marginBottom: 6,
                      background: `linear-gradient(90deg, ${t.border} 25%, ${t.bgCard} 50%, ${t.border} 75%)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s linear infinite',
                    }} />
                    <div style={{
                      width: `${40 + i * 8}%`, height: 8, borderRadius: 4,
                      background: `linear-gradient(90deg, ${t.border} 25%, ${t.bgCard} 50%, ${t.border} 75%)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s linear infinite',
                    }} />
                  </div>
                </div>
              ))
            )}

            {/* Status hint */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 14, padding: '8px 12px', borderRadius: 10,
              background: `${t.violet}06`,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: phase === 'error' ? t.rose : t.violet,
                animation: phase === 'error' ? 'none' : 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted }}>
                {phase === 'error'
                  ? msg
                  : pct > 0
                    ? tr('dashboard.ai_progress_hint', 'This usually takes 15-30 seconds')
                    : tr('dashboard.ai_connecting', 'Connecting to AI...')}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Quest list — only shown when quests are available */}
      {questGroups.length > 0 && (
        <DailyQuests
          questGroups={questGroups}
          completedQuests={engine.completedQuests}
          dailyCompleted={dailyCompleted}
          dailyTotal={dailyTotal}
          xpFloatId={engine.xpFloatId}
          xpFloatAmount={engine.xpFloatAmount}
          onCompleteQuest={(taskId, xp) => {
            const task = allTasks.get(taskId);
            engine.completeQuest(taskId, task?.goalLabel || '', xp);
          }}
          onUndoQuest={(taskId) => {
            const task = allTasks.get(taskId);
            engine.undoQuest(taskId, task?.xp || 0);
          }}
          onOpenQuest={setOpenQuestId}
          onOpenQuestReview={(taskId) => {
            setQuestReviewMode(true);
            setOpenQuestId(taskId);
          }}
        />
      )}

      {/* Zone 4: Quest Lines — detailed milestone progress */}
      <QuestLines
        selectedGoals={selectedGoals}
        skillAssessments={skillAssessments}
      />

      {/* Zone 5: Training Grounds — review & mastery */}
      <TrainingGrounds
        skills={mastery.skills}
        overallMastery={mastery.overallMastery}
        dueCount={mastery.dueCount}
        dueItems={mastery.dueItems}
        onStartReview={handleStartReview}
        isSubmitting={mastery.isSubmitting}
      />

      {/* ═══ Sidebar content inline — visible only when right sidebar is hidden (<1200px) ═══ */}
      <div className="sidebar-content-inline">
        {/* Skill Mastery — spaced repetition overview (Phase 5D) */}
        {mastery.skills.length > 0 && (
          <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease-out 0.15s both' }}>
            <h2 style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: t.display, fontSize: 13, fontWeight: 700,
              color: t.textSecondary, textTransform: 'uppercase' as const,
              letterSpacing: '0.08em', marginBottom: 12,
            }}>
              <NeonIcon type="book" size={14} color="cyan" />
              {tr('sidebar.skill_mastery', 'Skill Mastery')}
              {mastery.dueCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.rose, padding: '2px 8px', borderRadius: 10,
                  background: `${t.rose}15`, border: `1px solid ${t.rose}25`,
                }}>
                  {mastery.dueCount} due
                </span>
              )}
            </h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
              {mastery.skills.map((skill, index) => (
                <div
                  key={skill.skillId}
                  style={{
                    animation: 'fadeUp 0.4s ease-out both',
                    animationDelay: `${0.15 + index * 0.08}s`,
                  }}
                >
                  <MasteryRing
                    masteryLevel={skill.masteryLevel}
                    skillDomain={skill.skillDomain}
                    isOverdue={skill.isOverdue}
                    size="md"
                    showLabel
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Challenges — personal weekly goals (Phase 5E) */}
        {weekly.challenges.length > 0 && (
          <WeeklyChallenges
            challenges={weekly.challenges}
            weekEnd={weekly.weekEnd}
            allCompleted={weekly.allCompleted}
            bonusClaimed={weekly.bonusClaimed}
          />
        )}

        {/* Social Cards — opt-in social features (UX-R162) */}
        {!quietMode && <SocialCards />}
      </div>

      {/* Error fallback — UX-R080: RPG error with CTA */}
      {selectedGoals.length > 0 && questGroups.length === 0 && (
        <QuestError onRetry={() => window.location.reload()} />
      )}
    </div>
  );
}
