'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store, useI18nStore } from '@plan2skill/store';
import { t } from '../_components/tokens';
import { trpc } from '@plan2skill/api-client';
import { StepBarV2 } from '../_components/StepBarV2';
import { NPCBubble } from '../_components/NPCBubble';
import { TileCard } from '../_components/TileCard';
import { TileGrid } from '../_components/TileGrid';
import { WizardShell } from '../_components/WizardShell';
import { INTENTS } from '../_data/intents';
import type { OnboardingIntent } from '@plan2skill/types';

// ═══════════════════════════════════════════
// INTENT — Step 1/5: Intent Discovery
// 4 intent cards, NPC Sage greeting, auto-advance 500ms
// "Exploring" → /home (implicit onboarding complete), others → /goal/{path}
// ═══════════════════════════════════════════

export default function IntentPage() {
  const router = useRouter();
  const { intent, setIntent, addXP, completeOnboarding } = useOnboardingV2Store();
  const locale = useI18nStore((s) => s.locale);
  const tr = useI18nStore((s) => s.t);
  const completeOnboardingMutation = trpc.user.completeOnboarding.useMutation();
  const [selected, setSelected] = useState<OnboardingIntent | null>(intent);

  // API data with mock fallback
  const { data: apiIntents } = trpc.onboarding.intents.useQuery(
    { locale },
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );
  const intents = useMemo(() => {
    if (!apiIntents?.length) return INTENTS;
    return apiIntents.map((ai) => {
      const mock = INTENTS.find((m) => m.id === ai.id);
      return {
        id: ai.id as OnboardingIntent,
        title: ai.title,
        description: ai.description,
        icon: (ai.icon ?? mock?.icon ?? 'target') as typeof INTENTS[number]['icon'],
        color: ai.color ?? mock?.color ?? '#9D7AFF',
        nextRoute: mock?.nextRoute ?? ai.nextRoute ?? '/legend',
      };
    });
  }, [apiIntents]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleSelect = (intentConfig: typeof intents[number]) => {
    setSelected(intentConfig.id);

    if (timerRef.current) clearTimeout(timerRef.current);

    const advanceDelay = reducedMotion ? 100 : 500;
    timerRef.current = setTimeout(() => {
      setIntent(intentConfig.id);
      // Only award XP if this is a fresh selection (not returning to page)
      if (!intent) {
        addXP(5);
      }
      // "Exploring" skips all steps → complete onboarding immediately
      if (intentConfig.id === 'exploring') {
        completeOnboarding();
        completeOnboardingMutation.mutate();
      }
      router.push(intentConfig.nextRoute);
    }, advanceDelay);
  };

  return (
    <WizardShell
      header={<StepBarV2 current={0} />}
      footer={
        <p style={{
          fontFamily: t.body,
          fontSize: 11,
          color: t.textMuted,
          textAlign: 'center',
        }}>
          {tr('onboarding.step1_footer')}
        </p>
      }
    >
      <NPCBubble
        characterId="sage"
        message={tr('npc.intent_welcome')}
        emotion="happy"
      />

      <div style={{ height: 12 }} />

      {/* Section label */}
      <p style={{
        fontFamily: t.body,
        fontSize: 13,
        color: t.cyan,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 16,
      }}>
        {tr('onboarding.step1_subtitle')}
      </p>

      {/* 2×2 Intent Grid */}
      <TileGrid columns={{ desktop: 2, mobile: 2 }} gap={8}>
        {intents.map((intentConfig, i) => (
          <TileCard
            key={intentConfig.id}
            icon={intentConfig.icon}
            color={intentConfig.color}
            label={intentConfig.title}
            description={intentConfig.description}
            selected={selected === intentConfig.id}
            onClick={() => handleSelect(intentConfig)}
            index={i}
          />
        ))}
      </TileGrid>
    </WizardShell>
  );
}
