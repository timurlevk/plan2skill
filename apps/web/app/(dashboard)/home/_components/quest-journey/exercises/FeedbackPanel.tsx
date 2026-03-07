'use client';

import React, { useState, useEffect } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { NPCInline } from '../../../../../(onboarding)/_components/NPCBubble';
import { useI18nStore } from '@plan2skill/store';

// ═══════════════════════════════════════════
// FEEDBACK PANEL — Correct / Incorrect / Partial feedback
// Shows after exercise answer with explanation + NPC reaction
// ═══════════════════════════════════════════

interface FeedbackPanelProps {
  correct: boolean;
  explanation: string;
  onContinue: () => void;
  partial?: boolean;
}

type FeedbackState = 'correct' | 'incorrect' | 'partial';

const feedbackConfig: Record<
  FeedbackState,
  { color: string; bg: string; icon: 'check' | 'close' | 'sparkle'; npcEmotion: 'happy' | 'neutral' | 'thinking' }
> = {
  correct: {
    color: t.cyan,
    bg: `${t.cyan}12`,
    icon: 'check',
    npcEmotion: 'happy',
  },
  incorrect: {
    color: t.rose,
    bg: `${t.rose}12`,
    icon: 'close',
    npcEmotion: 'neutral',
  },
  partial: {
    color: t.gold,
    bg: `${t.gold}12`,
    icon: 'sparkle',
    npcEmotion: 'thinking',
  },
};

export function FeedbackPanel({ correct, explanation, onContinue, partial = false }: FeedbackPanelProps) {
  const tr = useI18nStore((s) => s.t);

  const state: FeedbackState = partial ? 'partial' : correct ? 'correct' : 'incorrect';
  const config = feedbackConfig[state];

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const npcMessages: Record<FeedbackState, string> = {
    correct: tr('exercise.feedback.npc.correct', 'Well done! You nailed it!'),
    incorrect: tr('exercise.feedback.npc.incorrect', 'Keep trying! Every mistake is a lesson.'),
    partial: tr('exercise.feedback.npc.partial', 'Almost there! You are on the right track.'),
  };

  return (
    <div
      style={{
        background: config.bg,
        borderRadius: 12,
        border: `1px solid ${config.color}30`,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
      }}
    >
      {/* Status header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `${config.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NeonIcon type={config.icon} size={16} color={config.color} />
        </div>
        <span
          style={{
            fontFamily: t.display,
            fontSize: 14,
            fontWeight: 700,
            color: config.color,
          }}
        >
          {state === 'correct'
            ? tr('exercise.feedback.correct', 'Correct!')
            : state === 'partial'
              ? tr('exercise.feedback.partial', 'Partially Correct')
              : tr('exercise.feedback.incorrect', 'Incorrect')}
        </span>
      </div>

      {/* NPC reaction */}
      <NPCInline characterId="sage" message={npcMessages[state]} emotion={config.npcEmotion} />

      {/* Explanation */}
      <p
        style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {explanation}
      </p>

      {/* Continue button */}
      <button
        onClick={onContinue}
        style={{
          alignSelf: 'flex-end',
          background: config.color,
          border: 'none',
          borderRadius: 8,
          padding: '8px 20px',
          fontFamily: t.body,
          fontSize: 13,
          fontWeight: 600,
          color: t.bg,
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.85';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {tr('exercise.continue', 'Continue')}
      </button>
    </div>
  );
}
