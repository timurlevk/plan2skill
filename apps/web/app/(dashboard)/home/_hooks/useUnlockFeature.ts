'use client';

import { trpc } from '@plan2skill/api-client';

export function useUnlockFeature(taskId: string | null) {
  const utils = trpc.useUtils();
  return trpc.quest.unlockFeature.useMutation({
    onSuccess: () => {
      if (taskId) utils.quest.getContent.invalidate({ taskId });
      utils.budget.getBalance.invalidate();
    },
  });
}
