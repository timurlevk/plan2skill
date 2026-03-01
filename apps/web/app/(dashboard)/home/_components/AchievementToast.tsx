'use client';

import React, { useEffect } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import type { Achievement } from '../_data/achievements';

// ═══════════════════════════════════════════
// ACHIEVEMENT TOAST — Quest Alert with character companion
// Fixed: bottom-right (DW), top (MW)
// 3s auto-dismiss, tap to dismiss (UX-R164)
// aria-live="polite" for screen readers
// ═══════════════════════════════════════════

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  // Auto-dismiss after 3s
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Achievement unlocked: ${achievement.title}`}
      onClick={onDismiss}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 300,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${t.violet}30`,
        boxShadow: `0 0 30px ${t.violet}20, 0 12px 32px rgba(0,0,0,0.5)`,
        cursor: 'pointer',
        animation: 'slideUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        maxWidth: 320,
        minHeight: 48,
      }}
    >
      {/* Achievement icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${t.violet}15`,
        border: `1px solid ${t.violet}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'bounceIn 0.5s ease-out 0.1s both',
        flexShrink: 0,
      }}>
        <NeonIcon type={achievement.icon} size={18} color="violet" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, fontWeight: 800,
          color: t.gold, textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: 2,
        }}>
          Achievement Unlocked!
        </div>
        <div style={{
          fontFamily: t.display, fontSize: 14, fontWeight: 700,
          color: t.text,
        }}>
          {achievement.title}
        </div>
        <div style={{
          fontFamily: t.body, fontSize: 11, color: t.textSecondary,
        }}>
          {achievement.description}
        </div>
      </div>

      {/* Sparkle decoration */}
      <div style={{
        position: 'absolute', top: -4, right: -4,
        width: 8, height: 8, borderRadius: '50%',
        background: t.gold,
        animation: 'sparkle 1s ease-in-out infinite',
      }} />
    </div>
  );
}
