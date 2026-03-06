'use client';

import React, { useState } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';

// UX-R080: Error screens use RPG language + character companion + CTA
interface QuestErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function QuestError({
  title,
  message,
  onRetry,
}: QuestErrorProps) {
  const tr = useI18nStore((s) => s.t);
  // Retry button press + hover state (Micro tier: 150ms)
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // prefers-reduced-motion guard for ambient float
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="alert"
      style={{
        padding: 40,
        borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        textAlign: 'center',
        marginTop: 32,
        // Error entrance animation (Micro tier: 400ms)
        animation: 'fadeUp 0.4s ease-out',
      }}
    >
      {/* Shield icon — ambient float (guarded by reduced-motion) */}
      <div style={{
        display: 'inline-block',
        animation: prefersReducedMotion ? 'none' : 'float 3s ease-in-out infinite',
      }}>
        <NeonIcon type="blocked" size={40} color="rose" />
      </div>
      <p
        style={{
          fontFamily: t.display,
          fontSize: 16,
          fontWeight: 700,
          color: t.text,
          marginTop: 12,
          marginBottom: 4,
        }}
      >
        {title ?? tr('error.quest_title', 'The path is blocked')}
      </p>
      <p
        style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 16,
        }}
      >
        {message ?? tr('error.quest_subtitle', 'Something went wrong loading your quests.')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => { setPressed(false); setHovered(false); }}
          onMouseEnter={() => setHovered(true)}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            background: t.gradient,
            border: 'none',
            fontFamily: t.display,
            fontSize: 14,
            fontWeight: 700,
            color: t.text,
            cursor: 'pointer',
            minHeight: 44, // UX-R153: Touch target ≥ 44px
            transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
            transform: pressed
              ? 'scale(0.98)'
              : hovered
                ? 'translateY(-1px)'
                : 'translateY(0)',
            boxShadow: hovered && !pressed
              ? `0 4px 12px rgba(157,122,255,0.2)`
              : 'none',
          }}
        >
          {tr('forge.retry', 'Try again, hero')}
        </button>
      )}
    </div>
  );
}
