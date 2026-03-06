'use client';

import { trpc } from '@plan2skill/api-client';

export function useQuestContent(taskId: string | null) {
  const query = trpc.quest.getContent.useQuery(
    { taskId: taskId! },
    { enabled: !!taskId, staleTime: 5 * 60_000, retry: 1 },
  );
  return {
    content: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
