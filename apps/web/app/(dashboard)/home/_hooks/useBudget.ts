'use client';

import { trpc } from '@plan2skill/api-client';

export function useBudget() {
  const balance = trpc.budget.getBalance.useQuery(undefined, { staleTime: 30_000 });
  const spendCrystal = trpc.budget.spendCrystal.useMutation({
    onSuccess: () => balance.refetch(),
  });
  return {
    balance: balance.data,
    coins: balance.data?.coins ?? 0,
    crystals: balance.data?.crystals ?? 0,
    tier: balance.data?.subscriptionTier ?? 'free',
    refetch: balance.refetch,
    spendCrystal,
    isLoading: balance.isLoading,
  };
}
