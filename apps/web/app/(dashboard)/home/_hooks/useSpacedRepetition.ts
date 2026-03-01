import { useAuthStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';

// ─── Spaced Repetition Hook (Phase 5D) ──────────────────────────
// Connects MasteryRing display and review flow to tRPC backend.

export function useSpacedRepetition() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);


  const { data: mastery } = trpc.review.mastery.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });


  const { data: dueReviews } = trpc.review.due.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated, staleTime: 1000 * 60 * 2 },
  );


  const submitReviewMutation = trpc.review.submit.useMutation();

  const submitReview = async (skillId: string, quality: number) => {
    return submitReviewMutation.mutateAsync({ skillId, quality });
  };

  return {
    skills: mastery?.skills ?? [],
    overallMastery: mastery?.overallMastery ?? 0,
    totalSkills: mastery?.totalSkills ?? 0,
    masteredCount: mastery?.masteredCount ?? 0,
    dueCount: dueReviews?.totalDue ?? 0,
    dueItems: dueReviews?.items ?? [],
    submitReview,
    isSubmitting: submitReviewMutation.isPending,
  };
}
