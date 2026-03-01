import { useMemo, useCallback } from 'react';
import type { QuestTask } from '../_utils/quest-templates';
import type { GoalSelection } from '@plan2skill/types';

// ─── Daily Progress Derived State ────────────────────────────────

interface QuestGroup {
  goal: GoalSelection;
  goalData: any;
  tasks: QuestTask[];
}

export interface DailyProgressResult {
  dailyTotal: number;
  dailyCompleted: number;
  allTasks: Map<string, QuestTask>;
  getNextQuest: (currentQuestId: string | null) => string | null;
}

export function useDailyProgress(
  questGroups: QuestGroup[],
  completedQuests: Set<string>,
): DailyProgressResult {
  const allTasks = useMemo(() => {
    const map = new Map<string, QuestTask>();
    questGroups.forEach(({ tasks }) => tasks.forEach(t => map.set(t.id, t)));
    return map;
  }, [questGroups]);

  const dailyTotal = useMemo(() => {
    let count = 0;
    questGroups.forEach(({ tasks }) => { count += tasks.length; });
    return count;
  }, [questGroups]);

  const dailyCompleted = useMemo(() => {
    let count = 0;
    questGroups.forEach(({ tasks }) => {
      tasks.forEach(tk => { if (completedQuests.has(tk.id)) count++; });
    });
    return count;
  }, [questGroups, completedQuests]);

  const getNextQuest = useCallback((currentQuestId: string | null): string | null => {
    for (const { tasks } of questGroups) {
      for (const tk of tasks) {
        if (!completedQuests.has(tk.id) && tk.id !== currentQuestId) {
          return tk.id;
        }
      }
    }
    return null;
  }, [questGroups, completedQuests]);

  return { dailyTotal, dailyCompleted, allTasks, getNextQuest };
}
