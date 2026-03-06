import { useMemo, useEffect, useRef } from 'react';
import { useQuestStore, useAuthStore } from '@plan2skill/store';
import type { DailyQuest } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import type { QuestTask } from '../_utils/quest-templates';

// ═══════════════════════════════════════════
// QUEST SYSTEM — Server quest wire-up
// Phase W1: Fetches quest.daily, auto-generates if empty,
// transforms server tasks to QuestTask format for UI compatibility.
// ═══════════════════════════════════════════

/** Transform a server DailyQuest to the UI QuestTask format */
function serverTaskToQuestTask(task: DailyQuest, domainLabel: string): QuestTask {
  const kc = task.knowledgeCheck as {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  } | null;

  return {
    id: task.id,
    title: task.title,
    type: task.taskType,
    xp: task.xpReward,
    rarity: task.rarity as QuestTask['rarity'],
    mins: task.estimatedMinutes,
    desc: task.description,
    objectives: [
      `Complete: ${task.title}`,
      kc ? 'Answer the knowledge check' : 'Verify your work',
      'Mark quest as complete when done',
    ],
    aiTip: '',
    funFact: '',
    checkQuestion: kc?.question ?? '',
    checkOptions: kc?.options ?? [],
    checkCorrect: kc?.correctIndex ?? 0,
    goalLabel: domainLabel,
    goalIcon: 'target',
  };
}

/** Quest group matching the shape expected by DailyQuests component */
export interface QuestGroup {
  goal: { id: string; label: string; icon?: string };
  goalData: null;
  tasks: QuestTask[];
}

export function useQuestSystem(): {
  serverQuestGroups: QuestGroup[] | null;
  isLoadingQuests: boolean;
  isGeneratingQuests: boolean;
  hasServerQuests: boolean;
  refetchQuests: () => void;
  validateQuest: (validationType: string, validationData: Record<string, unknown>, knowledgeCheck?: unknown) => Promise<{ valid: boolean; qualityScore: number; feedback: string }>;
  createReview: (skillId: string, skillDomain?: string) => void;
  getServerQuest: (taskId: string) => DailyQuest | undefined;
} {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { dailyQuests, isGenerating, setDailyQuests, addGeneratedQuests, setGenerating } =
    useQuestStore();
  const generateAttemptedRef = useRef(false);

  // ── Fetch daily quests from server ──
  const {
    data: serverQuests,
    isLoading,
    refetch,
  } = trpc.quest.daily.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });

  // ── Auto-generate mutation ──
  const generateMutation = trpc.quest.generateDaily.useMutation();

  // ── Validate mutation (exposed for quest completion flow) ──
  const validateMutation = trpc.quest.validate.useMutation();

  // ── Review creation (fire-and-forget after quest completion) ──
  const createReviewMutation = trpc.review.create.useMutation();

  // Sync server response → store
  useEffect(() => {
    if (serverQuests && Array.isArray(serverQuests) && serverQuests.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDailyQuests(serverQuests as any as DailyQuest[]);
      generateAttemptedRef.current = false;
    }
  }, [serverQuests, setDailyQuests]);

  // Auto-generate if no quests exist and haven't tried yet
  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      serverQuests !== undefined &&
      Array.isArray(serverQuests) &&
      serverQuests.length === 0 &&
      !isGenerating &&
      !generateMutation.isPending &&
      !generateAttemptedRef.current
    ) {
      generateAttemptedRef.current = true;
      setGenerating(true);
      generateMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data && Array.isArray(data) && data.length > 0) {
            addGeneratedQuests(data as DailyQuest[]);
          }
          setGenerating(false);
        },
        onError: (err) => {
          console.warn('[QuestSystem] Failed to generate daily quests:', err.message);
          setGenerating(false);
        },
      });
    }
  }, [
    isAuthenticated,
    isLoading,
    serverQuests,
    isGenerating,
    generateMutation,
    addGeneratedQuests,
    setGenerating,
  ]);

  // Transform server quests to QuestGroup[] (grouped by skillDomain)
  const serverQuestGroups = useMemo((): QuestGroup[] | null => {
    if (!dailyQuests.length) return null;

    const byDomain = new Map<string, DailyQuest[]>();
    for (const task of dailyQuests) {
      const domain = task.skillDomain || 'Daily Quests';
      const group = byDomain.get(domain) || [];
      group.push(task);
      byDomain.set(domain, group);
    }

    return Array.from(byDomain.entries()).map(([domain, tasks]) => ({
      goal: { id: domain, label: domain, icon: 'target' },
      goalData: null,
      tasks: tasks.map((t) => serverTaskToQuestTask(t, domain)),
    }));
  }, [dailyQuests]);

  // ── Validate quest completion ──
  const validateQuest = async (
    validationType: string,
    validationData: Record<string, unknown>,
    knowledgeCheck?: unknown,
  ) => {
    try {
      const result = await validateMutation.mutateAsync({
        validationType,
        validationData,
        knowledgeCheck,
      });
      return result;
    } catch (err) {
      console.warn('[QuestSystem] Validation failed:', err);
      // Fallback: allow completion even if validation fails
      return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };
    }
  };

  // ── Create review item for spaced repetition ──
  const createReview = (skillId: string, skillDomain?: string) => {
    if (!isAuthenticated) return;
    createReviewMutation.mutate(
      { skillId, skillDomain },
      {
        onError: (err) =>
          console.warn('[QuestSystem] review.create failed:', err.message),
      },
    );
  };

  // ── Look up a DailyQuest by task ID (for validation type info) ──
  const getServerQuest = (taskId: string): DailyQuest | undefined =>
    dailyQuests.find((q) => q.id === taskId);

  return {
    /** Server quest groups (null if no server quests available) */
    serverQuestGroups,
    /** Loading state for initial fetch */
    isLoadingQuests: isLoading,
    /** AI generation in progress */
    isGeneratingQuests: isGenerating || generateMutation.isPending,
    /** Whether server quests are available */
    hasServerQuests: dailyQuests.length > 0,
    /** Refetch daily quests */
    refetchQuests: refetch,
    /** Validate quest completion (calls quest.validate) */
    validateQuest,
    /** Create spaced repetition review item (fire-and-forget) */
    createReview,
    /** Look up server quest by ID (for validation type, skillDomain) */
    getServerQuest,
  };
}
