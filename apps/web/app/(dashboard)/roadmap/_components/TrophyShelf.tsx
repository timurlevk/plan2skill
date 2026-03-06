'use client';

import React, { useState, useEffect } from 'react';
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
    bg: t.border, border: t.borderHover, iconColor: t.textMuted,
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
    opacity: 1, animation: 'glowPulse 8s ease-in-out infinite',
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
  // SSR-safe reduced-motion hook (BLOCKER — Крок 9)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Trophy hover state
  const [hoveredTrophy, setHoveredTrophy] = useState<number | null>(null);

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
              animation: reducedMotion
                ? 'none'
                : `${style.animation !== 'none' ? style.animation + ', ' : ''}fadeUp 0.4s ease-out both`,
              animationDelay: reducedMotion ? '0s' : `${i * 0.08}s`,
              transition: 'opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
              transform: hoveredTrophy === i ? 'scale(1.08)' : 'scale(1)',
              flexShrink: 0,
              position: 'relative',
              cursor: 'default',
            }}
            onMouseEnter={() => setHoveredTrophy(i)}
            onMouseLeave={() => setHoveredTrophy(null)}
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
                animation: reducedMotion ? 'none' : 'pulse 2s ease-in-out infinite',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
