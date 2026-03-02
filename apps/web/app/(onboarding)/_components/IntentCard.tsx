'use client';

import React from 'react';
import { t } from './tokens';
import { NeonIcon, type NeonIconType } from './NeonIcon';

// ═══════════════════════════════════════════
// INTENT CARD — SVG icon card for intent selection
// Auto-advance on selection (500ms delay, handled by parent)
// ═══════════════════════════════════════════

interface IntentCardProps {
  icon: NeonIconType;
  color: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  index: number;
}

export function IntentCard({ icon, color, title, description, selected, onClick, index }: IntentCardProps) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '20px 12px',
        borderRadius: 16,
        border: `2px solid ${selected ? color : t.border}`,
        background: selected ? `${color}12` : t.bgCard,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: `fadeUp 0.4s ease-out ${index * 0.08}s both`,
        boxShadow: selected ? `0 0 20px ${color}30` : 'none',
        textAlign: 'center',
        minHeight: 140,
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: selected ? `${color}20` : '#1E1E28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        transform: selected ? 'scale(1.1)' : 'scale(1)',
      }}>
        <NeonIcon type={icon} size={28} color={color} active={selected} />
      </div>

      <div>
        <div style={{
          fontFamily: t.display,
          fontSize: 14,
          fontWeight: 700,
          color: selected ? t.text : '#D4D4D8',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: t.body,
          fontSize: 11,
          color: t.textMuted,
          lineHeight: 1.4,
        }}>
          {description}
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'celebratePop 0.3s ease-out',
          position: 'absolute',
          top: 8,
          right: 8,
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}
