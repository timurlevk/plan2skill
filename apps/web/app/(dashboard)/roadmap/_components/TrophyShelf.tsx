'use client';

import React from 'react';
import type { Milestone } from '@plan2skill/types';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity as rarityTokens } from '../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// TROPHY SHELF — BL-007
// Row of achievement badges above timeline nodes
// UX-R105: Endowed Progress — nearUnlock teasing at ≥75%
// ═══════════════════════════════════════════

interface TrophyShelfProps {
  milestones: Milestone[];
  unlockedAchievements: string[];
}

type BadgeState = 'locked' | 'nearUnlock' | 'unlocked' | 'legendary';

function getMilestoneBadgeState(
  milestone: Milestone,
  index: number,
  total: number,
): BadgeState {
  const isFinal = index === total - 1;

  if (milestone.status === 'completed') {
    return isFinal ? 'legendary' : 'unlocked';
  }
  if (milestone.status === 'active' && milestone.progress >= 75) {
    return 'nearUnlock'; // UX-R105
  }
  return 'locked';
}

const BADGE_STYLES: Record<BadgeState, {
  bg: string; border: string; iconColor: string; opacity: number; animation: string;
}> = {
  locked: {
    bg: '#252530', border: '#35354A', iconColor: '#71717A',
    opacity: 0.4, animation: 'none',
  },
  nearUnlock: {
    bg: `${t.violet}15`, border: `${t.violet}40`, iconColor: t.violet,
    opacity: 0.7, animation: 'shimmer 2s linear infinite',
  },
  unlocked: {
    bg: `${t.cyan}15`, border: t.cyan, iconColor: t.cyan,
    opacity: 1, animation: 'none',
  },
  legendary: {
    bg: `${t.gold}15`, border: t.gold, iconColor: t.gold,
    opacity: 1, animation: 'glowPulse 3s ease-in-out infinite',
  },
};

// Map rarity to icon shape (double-coded: color + shape + icon)
const RARITY_ICONS: Record<string, string> = {
  common: '●',
  uncommon: '◆',
  rare: '⬡',
  epic: '◈',
  legendary: '★',
};

export function TrophyShelf({ milestones, unlockedAchievements }: TrophyShelfProps) {
  if (!milestones.length) return null;

  return (
    <div
      role="region"
      aria-label="Trophy shelf — milestone achievements"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: '8px 0',
      }}
    >
      {milestones.map((ms, i) => {
        const state = getMilestoneBadgeState(ms, i, milestones.length);
        const style = BADGE_STYLES[state];
        const isFinal = i === milestones.length - 1;

        return (
          <div
            key={ms.id}
            aria-label={`Milestone ${i + 1} badge: ${state}${isFinal ? ', final boss' : ''}`}
            style={{
              width: 40, height: 40, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: style.bg,
              border: `1.5px solid ${style.border}`,
              opacity: style.opacity,
              animation: style.animation,
              transition: 'all 0.3s ease',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {isFinal ? (
              <NeonIcon type="crown" size={18} color={style.iconColor} />
            ) : state === 'unlocked' || state === 'legendary' ? (
              <NeonIcon type="check" size={16} color={style.iconColor} />
            ) : state === 'nearUnlock' ? (
              <NeonIcon type="sparkle" size={16} color={style.iconColor} />
            ) : (
              <NeonIcon type="lock" size={14} color={style.iconColor} />
            )}

            {/* Near-unlock progress ring */}
            {state === 'nearUnlock' && (
              <div style={{
                position: 'absolute', inset: -3,
                borderRadius: 14,
                border: `2px solid ${t.violet}30`,
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
