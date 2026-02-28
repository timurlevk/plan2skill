import React from 'react';
import type { Rarity } from '@plan2skill/types';
import { RARITIES } from '../tokens/gamification';

export interface RarityBadgeProps {
  rarity: Rarity;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export function RarityBadge({
  rarity,
  showLabel = true,
  size = 'sm',
  style,
}: RarityBadgeProps) {
  const config = RARITIES.find((r) => r.id === rarity) || RARITIES[0];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        borderRadius: 100,
        fontSize: size === 'sm' ? 9 : 11,
        fontWeight: 700,
        fontFamily: '"JetBrains Mono", monospace',
        color: config.color,
        background: config.bgColor,
        border: `1px solid ${config.color}30`,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        boxShadow: config.glow || undefined,
        ...style,
      }}
    >
      <span style={{ fontSize: size === 'sm' ? 7 : 9 }}>{config.roman}</span>
      {showLabel && config.label}
    </span>
  );
}
