'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store } from '@plan2skill/store';
import { t } from '../_components/tokens';
import { StepBarV2 } from '../_components/StepBarV2';
import { NPCBubble } from '../_components/NPCBubble';
import { IntentCard } from '../_components/IntentCard';
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
  const [selected, setSelected] = useState<OnboardingIntent | null>(intent);
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

  const handleSelect = (intentConfig: typeof INTENTS[number]) => {
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
          You can always change your path later in Hero Settings
        </p>
      }
    >
      <NPCBubble
        characterId="sage"
        message="Welcome, hero! Every great quest begins with a single choice. What brings you here today?"
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
        Choose your path
      </p>

      {/* 2×2 Intent Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {INTENTS.map((intentConfig, i) => (
          <div key={intentConfig.id} style={{ position: 'relative' }}>
            <IntentCard
              icon={intentConfig.icon}
              color={intentConfig.color}
              title={intentConfig.title}
              description={intentConfig.description}
              selected={selected === intentConfig.id}
              onClick={() => handleSelect(intentConfig)}
              index={i}
            />
          </div>
        ))}
      </div>
    </WizardShell>
  );
}
