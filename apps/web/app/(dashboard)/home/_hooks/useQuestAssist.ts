'use client';

import { trpc } from '@plan2skill/api-client';

export function useQuestAssist(taskId: string | null) {
  const utils = trpc.useUtils();

  const requestHint = trpc.quest.requestHint.useMutation({
    onSuccess: () => utils.budget.getBalance.invalidate(),
  });

  const requestExplain = trpc.quest.requestExplain.useMutation({
    onSuccess: () => utils.budget.getBalance.invalidate(),
  });

  const requestTutor = trpc.quest.requestTutor.useMutation({
    onSuccess: () => utils.budget.getBalance.invalidate(),
  });

  return { requestHint, requestExplain, requestTutor };
}
