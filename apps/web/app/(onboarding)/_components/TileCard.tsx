'use client';

import React from 'react';
import { t } from './tokens';
import { NeonIcon, type NeonIconType } from './NeonIcon';

// ═══════════════════════════════════════════
// TILE CARD — Reusable visual tile (domain/interest/pain)
// Single or multi-select mode
// ═══════════════════════════════════════════

interface TileCardProps {
  icon: NeonIconType;
  color: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  index?: number;
  badge?: string;
  size?: 'normal' | 'compact';
}

export function TileCard({
  icon, color, label, description, selected, onClick,
  index = 0, badge, size = 'normal',
}: TileCardProps) {
  const isCompact = size === 'compact';

  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      style={{
        display: 'flex',
        flexDirection: isCompact ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: isCompact ? 'flex-start' : 'center',
        gap: isCompact ? 8 : 8,
        padding: isCompact ? '10px 12px' : '14px 10px',
        borderRadius: 12,
        border: `2px solid ${selected ? color : t.border}`,
        background: selected ? `${color}12` : t.bgCard,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: `fadeUp 0.35s ease-out ${index * 0.05}s both`,
        boxShadow: selected ? `0 0 16px ${color}25` : 'none',
        textAlign: isCompact ? 'left' : 'center',
        position: 'relative',
        width: '100%',
        minHeight: isCompact ? 44 : undefined,
      }}
    >
      {/* Badge (Trending) */}
      {badge && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: 8,
          padding: '2px 8px',
          borderRadius: 6,
          background: `${t.rose}20`,
          border: `1px solid ${t.rose}40`,
          fontFamily: t.mono,
          fontSize: 8,
          fontWeight: 700,
          color: t.rose,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div style={{
        width: isCompact ? 30 : 34,
        height: isCompact ? 30 : 34,
        borderRadius: isCompact ? 8 : 10,
        background: selected ? `${color}20` : '#1E1E28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s ease',
      }}>
        <NeonIcon type={icon} size={isCompact ? 16 : 18} color={color} active={selected} />
      </div>

      {/* Text */}
      <div style={{ flex: isCompact ? 1 : undefined }}>
        <div style={{
          fontFamily: t.display,
          fontSize: isCompact ? 13 : 12,
          fontWeight: 600,
          color: selected ? t.text : '#D4D4D8',
          lineHeight: 1.3,
        }}>
          {label}
        </div>
        {description && (
          <div style={{
            fontFamily: t.body,
            fontSize: 11,
            color: t.textMuted,
            marginTop: 2,
            lineHeight: 1.3,
          }}>
            {description}
          </div>
        )}
      </div>

      {/* Selection check */}
      {selected && (
        <div style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'celebratePop 0.25s ease-out',
          flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}
