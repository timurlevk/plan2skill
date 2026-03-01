'use client';

import React from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import type { AchievementRarity } from '../_data/achievements';

// ─── Achievement Badge — visual badge element (Phase 5E) ────────
// State machine: locked → nearUnlock → unlocking → unlocked → equipped
// Metallics from Style Guide v8 achievement tokens.

const METALLIC: Record<AchievementRarity, string> = {
  common: 'linear-gradient(135deg, #CD7F32, #E8A862)',
  uncommon: 'linear-gradient(135deg, #CD7F32, #E8A862)',
  rare: 'linear-gradient(135deg, #C0C0C0, #E8E8E8)',
  epic: 'linear-gradient(135deg, #FFD166, #FBBF24)',
  legendary: 'linear-gradient(135deg, #E0E7EE, #B8C5D6)',
};

const GLOW_COLOR: Record<AchievementRarity, string> = {
  common: '#CD7F3240',
  uncommon: '#CD7F3260',
  rare: '#C0C0C060',
  epic: '#FFD16660',
  legendary: '#E0E7EE80',
};

const RARITY_ICON: Record<AchievementRarity, string> = {
  common: '●',
  uncommon: '◆',
  rare: '⬡',
  epic: '◈',
  legendary: '★',
};

const RARITY_COLOR: Record<AchievementRarity, string> = {
  common: '#71717A',
  uncommon: '#6EE7B7',
  rare: '#3B82F6',
  epic: '#9D7AFF',
  legendary: '#FFD166',
};

const SIZES = {
  sm: { badge: 40, icon: 18 },
  md: { badge: 56, icon: 24 },
  lg: { badge: 80, icon: 36 },
} as const;

export type BadgeState = 'locked' | 'nearUnlock' | 'unlocked' | 'equipped';

interface AchievementBadgeProps {
  title: string;
  icon: string;
  rarity: AchievementRarity;
  state: BadgeState;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function AchievementBadge({
  title,
  icon,
  rarity,
  state,
  progress,
  size = 'md',
  onClick,
  style,
}: AchievementBadgeProps) {
  const dim = SIZES[size];
  const metallic = METALLIC[rarity];
  const glow = GLOW_COLOR[rarity];
  const rarColor = RARITY_COLOR[rarity];
  const isLocked = state === 'locked' || state === 'nearUnlock';

  const badgeStyle: React.CSSProperties = {
    width: dim.badge,
    height: dim.badge,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.4s ease',
    cursor: onClick ? 'pointer' : 'default',
    position: 'relative',
    ...(isLocked
      ? {
          background: '#252530',
          border: '1px solid #35354A',
          filter: state === 'nearUnlock' ? 'grayscale(0.6)' : 'grayscale(1)',
          opacity: state === 'nearUnlock' ? 0.7 : 0.5,
        }
      : {
          background: metallic,
          border: `${state === 'equipped' ? 2 : 1}px solid ${glow}`,
          boxShadow:
            state === 'equipped'
              ? `0 0 20px ${glow}, 0 0 40px ${glow}`
              : `0 0 12px ${glow}`,
          filter: 'none',
          opacity: 1,
        }),
  };

  const ariaLabel =
    state === 'locked'
      ? `Locked achievement: ${title}`
      : state === 'nearUnlock'
        ? `Locked achievement: ${title} (${Math.round((progress ?? 0) * 100)}% progress)`
        : `${title} — ${rarity}${state === 'equipped' ? ' (equipped)' : ''}`;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        ...style,
      }}
    >
      <div
        onClick={onClick}
        role="img"
        aria-label={ariaLabel}
        style={badgeStyle}
      >
        <NeonIcon
          type={isLocked ? 'lock' : (icon as any)}
          size={dim.icon}
          color={isLocked ? t.textMuted : rarColor}
        />

        {/* Rarity dot */}
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#18181F',
            border: `1px solid ${rarColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            color: rarColor,
          }}
        >
          {RARITY_ICON[rarity]}
        </div>

        {/* Near-unlock progress ring */}
        {state === 'nearUnlock' && progress != null && (
          <svg
            style={{ position: 'absolute', top: -3, left: -3, pointerEvents: 'none' }}
            width={dim.badge + 6}
            height={dim.badge + 6}
          >
            <circle
              cx={(dim.badge + 6) / 2}
              cy={(dim.badge + 6) / 2}
              r={dim.badge / 2 + 1}
              fill="none"
              stroke={rarColor}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * (dim.badge / 2 + 1)}
              strokeDashoffset={2 * Math.PI * (dim.badge / 2 + 1) * (1 - progress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${(dim.badge + 6) / 2} ${(dim.badge + 6) / 2})`}
              style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
            />
          </svg>
        )}
      </div>

      {/* Title (md and lg only) */}
      {size !== 'sm' && (
        <span
          style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 600,
            color: isLocked ? t.textMuted : t.textSecondary,
            textAlign: 'center',
            maxWidth: dim.badge + 16,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isLocked ? '???' : title}
        </span>
      )}
    </div>
  );
}
