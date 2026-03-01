'use client';

import React from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// CONTINUE BUTTON — gradient CTA
// Disabled state with muted appearance
// ═══════════════════════════════════════════

export function ContinueButton({ onClick, disabled = false, children = 'Continue', style: extraStyle = {} }: {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '16px 0',
        borderRadius: 16,
        border: 'none',
        background: disabled ? '#252530' : t.gradient,
        color: disabled ? '#71717A' : '#FFF',
        fontFamily: t.display,
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.5 : 1,
        boxShadow: disabled ? 'none' : `0 0 20px ${t.violet}30`,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

export function BackButton({ onClick, style: extraStyle = {} }: {
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 12,
        border: `1px solid ${t.border}`,
        background: 'transparent',
        color: t.textSecondary,
        fontSize: 18,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        ...extraStyle,
      }}
      aria-label="Go back"
    >
      ←
    </button>
  );
}
