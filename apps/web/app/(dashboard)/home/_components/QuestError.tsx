'use client';

import React from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';

const t = {
  display: '"Plus Jakarta Sans", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  bgCard: '#18181F',
  border: '#252530',
  gradient: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
};

// UX-R080: Error screens use RPG language + character companion + CTA
interface QuestErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function QuestError({
  title = 'The path is blocked',
  message = 'Something went wrong loading your quests.',
  onRetry,
}: QuestErrorProps) {
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
      }}
    >
      <NeonIcon type="shield" size={40} color="rose" />
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
        {title}
      </p>
      <p
        style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          marginBottom: 16,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            background: t.gradient,
            border: 'none',
            fontFamily: t.display,
            fontSize: 14,
            fontWeight: 700,
            color: '#FFF',
            cursor: 'pointer',
            minHeight: 44, // UX-R153: Touch target ≥ 44px
          }}
        >
          Try again, hero
        </button>
      )}
    </div>
  );
}
