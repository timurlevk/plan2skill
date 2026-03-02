'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store } from '@plan2skill/store';

// ═══════════════════════════════════════════
// FIRST QUEST — Redirect to /home
// Onboarding now completes implicitly at character step.
// This page kept for backward compatibility (deep links, back navigation).
// ═══════════════════════════════════════════

export default function FirstQuestRedirect() {
  const router = useRouter();
  const { completeOnboarding } = useOnboardingV2Store();

  useEffect(() => {
    completeOnboarding();
    router.replace('/home');
  }, []);

  return null;
}
