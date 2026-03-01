'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useOnboardingStore, useProgressionStore } from '@plan2skill/store';
import { t } from '../../(onboarding)/_components/tokens';
import { CHARACTERS } from '../../(onboarding)/_components/characters';
import { GOALS } from '../../(onboarding)/_data/goals';
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
import { WelcomeBack } from './_components/WelcomeBack';
import { SkeletonLoader } from './_components/SkeletonLoader';
import { SocialCards } from './_components/SocialCards';
import { WeeklyChallenges } from './_components/WeeklyChallenges';
import { QuestError } from './_components/QuestError';
import { useWeeklyChallenges } from './_hooks/useWeeklyChallenges';

// ═══════════════════════════════════════════
// COMMAND CENTER — Dashboard home page orchestrator
// ═══════════════════════════════════════════

export default function HomePage() {
  const { selectedGoals, skillAssessments, characterId, archetypeId } = useOnboardingStore();
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

  // Generate quest groups from goals
  const questGroups = useMemo(() => {
    return selectedGoals.map(g => {
      const goalData = GOALS.find(gd => gd.id === g.id);
      return {
        goal: g,
        goalData,
        tasks: generateTasks(g.label, g.id, goalData?.icon || 'target'),
      };
    });
  }, [selectedGoals]);

  // Daily progress (derived state)
  const { dailyTotal, dailyCompleted, allTasks, getNextQuest } =
    useDailyProgress(questGroups, engine.completedQuests);

  // Modal state
  const [openQuestId, setOpenQuestId] = useState<string | null>(null);
  const openTask = openQuestId ? allTasks.get(openQuestId) : null;

  if (!hydrated || isHydrating) return <SkeletonLoader />;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
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
        />
      )}

      {/* Achievement Toast */}
      <AchievementToast
        achievement={engine.newlyUnlockedAchievements[0] || null}
        onDismiss={engine.dismissAchievement}
      />

      {/* Welcome Back greeting (UX-R102) */}
      <WelcomeBack
        lastActivityDate={lastActivityDate}
        characterId={characterId}
        characterName={charMeta?.name || 'Hero'}
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

      {/* Weekly Challenges — personal weekly goals (Phase 5E) */}
      {weekly.challenges.length > 0 && (
        <WeeklyChallenges challenges={weekly.challenges} weekEnd={weekly.weekEnd} />
      )}

      {/* Social Cards — opt-in social features (UX-R162) */}
      {!quietMode && <SocialCards />}

      {/* Active Quests */}
      <ActiveQuests
        selectedGoals={selectedGoals}
        skillAssessments={skillAssessments}
      />

      {/* Today's Quests */}
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

      {/* Error fallback — UX-R080: RPG error with CTA */}
      {selectedGoals.length > 0 && questGroups.length === 0 && (
        <QuestError onRetry={() => window.location.reload()} />
      )}
    </div>
  );
}
