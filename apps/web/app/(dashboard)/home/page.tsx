'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useOnboardingStore, useOnboardingV2Store, useProgressionStore } from '@plan2skill/store';
import { t } from '../../(onboarding)/_components/tokens';
import { CHARACTERS } from '../../(onboarding)/_components/characters';
import { ARCHETYPES } from '../../(onboarding)/_data/archetypes';

import { generateTasks } from './_utils/quest-templates';
import { getGreeting } from './_utils/xp-utils';
import { useQuestEngine } from './_hooks/useQuestEngine';
import { useDailyProgress } from './_hooks/useDailyProgress';
import { useServerHydration } from './_hooks/useServerHydration';
import { QuestCardModal } from './_components/QuestCardModal';
import { StatsRow } from './_components/StatsRow';
import { ActiveQuests } from './_components/ActiveQuests';
import { DailyQuests } from './_components/DailyQuests';
import { AchievementToast } from './_components/AchievementToast';
import { WelcomeBack, getDaysSince } from './_components/WelcomeBack';
import { SkeletonLoader } from './_components/SkeletonLoader';
import { SocialCards } from './_components/SocialCards';
import { WeeklyChallenges } from './_components/WeeklyChallenges';
import { QuestError } from './_components/QuestError';
import { AttributeWidget } from './_components/AttributeWidget';
import { useWeeklyChallenges } from './_hooks/useWeeklyChallenges';
import { useSpacedRepetition } from './_hooks/useSpacedRepetition';
import { MasteryRing } from './_components/MasteryRing';
import { NeonIcon } from '../../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════
// LEVEL-UP CELEBRATION — Macro animation (§3 Reward sequences)
// Auto-dismiss 2500ms, tap-to-skip, reduced-motion safe
// ═══════════════════════════════════════════

const CONFETTI_COLORS = [t.violet, t.cyan, t.rose, t.gold, '#6EE7B7', '#818CF8', '#E879F9', '#FFD166'];

function LevelUpCelebration({ newLevel, onDismiss }: { newLevel: number; onDismiss: () => void }) {
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
        Ascension!
      </div>

      {/* New level number */}
      <div style={{
        fontFamily: t.display, fontSize: 64, fontWeight: 900,
        color: t.text,
        animation: reducedMotion ? 'none' : 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
      }}>
        Level {newLevel}
      </div>

      {/* Tap to skip hint */}
      <div style={{
        fontFamily: t.body, fontSize: 12, color: t.textMuted,
        marginTop: 24,
        animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease-out 0.6s both',
      }}>
        Tap anywhere to continue
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// STREAK MILESTONE CELEBRATION — Meso animation
// Milestones: 7, 30, 100, 365
// ═══════════════════════════════════════════

const STREAK_MILESTONES: Record<number, string> = {
  7: '7-Day Streak!',
  30: '30-Day Legend!',
  100: '100-Day Master!',
  365: '365-Day Immortal!',
};

function StreakMilestoneCelebration({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label = STREAK_MILESTONES[streak] || `${streak}-Day Streak!`;

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
        Tap to continue
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// COMMAND CENTER — Dashboard home page orchestrator
// ═══════════════════════════════════════════

export default function HomePage() {
  const { selectedGoals, skillAssessments, characterId, archetypeId } = useOnboardingStore();
  const { onboardingCompletedAt } = useOnboardingV2Store();
  const { totalXp, level, currentStreak, energyCrystals, maxEnergyCrystals,
    lastActivityDate, quietMode, consumeCrystal } = useProgressionStore();

  const charMeta = CHARACTERS.find(c => c.id === characterId);
  const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;

  // Hydration guard — show skeleton until store rehydrates
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Server hydration — sync progression from backend on load
  const { isHydrating } = useServerHydration();

  // Quest engine — persistence pipeline
  const engine = useQuestEngine();

  // Weekly challenges (Phase 5E)
  const weekly = useWeeklyChallenges();

  // Spaced repetition mastery (Phase 5D)
  const mastery = useSpacedRepetition();

  // Generate quest groups from goals
  const questGroups = useMemo(() => {
    return selectedGoals.map(g => {
      return {
        goal: g,
        goalData: null,
        tasks: generateTasks(g.label, g.id, 'target'),
      };
    });
  }, [selectedGoals]);

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
  const openTask = openQuestId ? allTasks.get(openQuestId) : null;

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
      {/* Quest Card Modal */}
      {openTask && (
        <QuestCardModal
          task={openTask}
          done={engine.completedQuests.has(openTask.id)}
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
      )}

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

      {/* Welcome Back greeting + warm-up quest (UX-R102, UX-R100) */}
      <WelcomeBack
        lastActivityDate={lastActivityDate}
        characterId={characterId}
        characterName={charMeta?.name || 'Hero'}
        warmupQuest={warmupQuest}
        isQuestCompleted={warmupQuest ? engine.completedQuests.has(warmupQuest.id) : false}
        onStartQuest={setOpenQuestId}
        onCompleteQuest={(taskId, xp) => {
          const task = allTasks.get(taskId);
          engine.completeQuest(taskId, task?.goalLabel || '', xp);
        }}
        onChooseDifferent={scrollToDailyQuests}
        daysAbsent={daysAbsent}
        isFirstVisit={isFirstVisit}
      />

      {/* Greeting */}
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

      {/* Stats Row */}
      <StatsRow
        level={level}
        currentStreak={currentStreak}
        totalXp={totalXp}
        energyCrystals={energyCrystals}
        maxEnergyCrystals={maxEnergyCrystals}
      />

      {/* Phase 5H: Attribute Widget — inline on mobile, hidden on desktop (shown in sidebar) */}
      <div className="sidebar-content-inline" style={{ marginBottom: 16 }}>
        <AttributeWidget />
      </div>

      {/* Today's Quests — BL-004: moved up as PRIMARY ACTION */}
      <div ref={dailyQuestsRef} />
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
      />

      {/* Active Quests — BL-004: moved after daily quests */}
      <ActiveQuests
        selectedGoals={selectedGoals}
        skillAssessments={skillAssessments}
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
              Skill Mastery
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
