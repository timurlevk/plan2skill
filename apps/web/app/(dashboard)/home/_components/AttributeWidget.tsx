'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterStore, useI18nStore } from '@plan2skill/store';
import { t } from '../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import type { NeonIconType } from '../../../(onboarding)/_components/NeonIcon';

// ═══════════════════════════════════════════
// ATTRIBUTE WIDGET — Phase 5H
// Compact 3×2 grid showing all 6 D&D attributes
// Click/hover → tooltip with description + breakdown
// Micro tier animation: fadeUp 0.4s (§N §2)
// ═══════════════════════════════════════════

const ATTRS: {
  key: string;
  name: string;
  fullName: string;
  fullNameKey: string;
  icon: NeonIconType;
  color: string;
  description: string;
  descKey: string;
}[] = [
  { key: 'STR', name: 'STR', fullName: 'Strength', fullNameKey: 'attributes.str', icon: 'shield', color: '#9D7AFF',
    description: 'Your technical might. Grows from Hard Skills milestones and equipment.', descKey: 'attributes.str_desc' },
  { key: 'INT', name: 'INT', fullName: 'Intelligence', fullNameKey: 'attributes.int', icon: 'sparkle', color: '#3B82F6',
    description: 'Strategic thinking. Grows from Strategy milestones and equipment.', descKey: 'attributes.int_desc' },
  { key: 'CHA', name: 'CHA', fullName: 'Charisma', fullNameKey: 'attributes.cha', icon: 'users', color: '#FF6B8A',
    description: 'Communication and leadership. Grows from Communication milestones.', descKey: 'attributes.cha_desc' },
  { key: 'CON', name: 'CON', fullName: 'Constitution', fullNameKey: 'attributes.con', icon: 'trophy', color: '#6EE7B7',
    description: 'Consistency and endurance. Grows from sustained practice.', descKey: 'attributes.con_desc' },
  { key: 'DEX', name: 'DEX', fullName: 'Dexterity', fullNameKey: 'attributes.dex', icon: 'compass', color: '#4ECDC4',
    description: 'Adaptability and breadth. Grows from cross-domain exploration.', descKey: 'attributes.dex_desc' },
  { key: 'WIS', name: 'WIS', fullName: 'Wisdom', fullNameKey: 'attributes.wis', icon: 'star', color: '#FFD166',
    description: 'Curiosity and exploration. Grows from Hobbies milestones.', descKey: 'attributes.wis_desc' },
];

export function AttributeWidget({ compact = false }: { compact?: boolean }) {
  // Reduced-motion check — §N MICRO_ANIMATION_GUIDELINES §10 (BLOCKER)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const tr = useI18nStore((s) => s.t);
  const { computedAttributes } = useCharacterStore();
  const [tooltipAttr, setTooltipAttr] = useState<string | null>(null);

  return (
    <div
      role="region"
      aria-label={tr('attributes.title', 'Hero Attributes')}
      style={{
        padding: compact ? 12 : 16,
        borderRadius: 16,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        animation: prefersReducedMotion ? 'none' : 'fadeUp 0.4s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: compact ? 8 : 12,
      }}>
        <NeonIcon type="hexWeb" size={compact ? 12 : 14} color="violet" />
        <span style={{
          fontFamily: t.display, fontSize: compact ? 9 : 10, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
        }}>
          {tr('attributes.title', 'Hero Attributes')}
        </span>
      </div>

      {/* 3×2 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: compact ? 6 : 8,
      }}>
        {ATTRS.map((attr) => {
          const totalVal = computedAttributes.total[attr.key as keyof typeof computedAttributes.total] ?? 10;
          const baseVal = computedAttributes.base[attr.key as keyof typeof computedAttributes.base] ?? 10;
          const bonusVal = computedAttributes.bonus[attr.key as keyof typeof computedAttributes.bonus] ?? 0;
          const isTooltipOpen = tooltipAttr === attr.key;

          return (
            <div
              key={attr.key}
              onClick={() => setTooltipAttr(isTooltipOpen ? null : attr.key)}
              onMouseEnter={() => setTooltipAttr(attr.key)}
              onMouseLeave={() => setTooltipAttr(null)}
              aria-label={`${tr(attr.fullNameKey, attr.fullName)}: ${totalVal}. ${tr(attr.descKey, attr.description)}`}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: compact ? '6px 4px' : '8px 6px',
                borderRadius: 10,
                background: isTooltipOpen ? `${attr.color}08` : 'transparent',
                border: `1px solid ${isTooltipOpen ? `${attr.color}20` : 'transparent'}`,
                cursor: 'pointer',
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
            >
              {/* Icon + Value */}
              <NeonIcon type={attr.icon} size={compact ? 14 : 16} color={attr.color} />
              <span style={{
                fontFamily: t.mono, fontSize: compact ? 14 : 16, fontWeight: 800,
                color: t.text, lineHeight: 1.2, marginTop: 2,
              }}>
                {totalVal}
              </span>
              {/* Key label */}
              <span style={{
                fontFamily: t.mono, fontSize: compact ? 8 : 9, fontWeight: 700,
                color: attr.color, letterSpacing: '0.05em',
              }}>
                {attr.key}
              </span>
              {/* Bonus indicator */}
              {bonusVal > 0 && (
                <span style={{
                  fontFamily: t.mono, fontSize: 7, fontWeight: 700,
                  color: t.mint, marginTop: 1,
                }}>
                  +{bonusVal}
                </span>
              )}

              {/* Tooltip popover — Micro tier (fadeUp 0.15s) */}
              {isTooltipOpen && (
                <div
                  role="tooltip"
                  style={{
                    position: 'absolute',
                    top: '100%', left: '50%', transform: 'translateX(-50%)',
                    marginTop: 6, padding: '8px 12px', borderRadius: 10,
                    background: t.bgElevated, border: `1px solid ${attr.color}30`,
                    boxShadow: `0 8px 20px rgba(0,0,0,0.4), 0 0 10px ${attr.color}12`,
                    zIndex: 20, minWidth: 160, maxWidth: 220,
                    animation: prefersReducedMotion ? 'none' : 'fadeUp 0.15s ease-out',
                  }}
                >
                  <div style={{
                    fontFamily: t.display, fontSize: 11, fontWeight: 800,
                    color: attr.color, marginBottom: 3,
                  }}>
                    {tr(attr.fullNameKey, attr.fullName)}
                  </div>
                  <div style={{
                    fontFamily: t.body, fontSize: 10, color: t.textSecondary,
                    lineHeight: 1.4, marginBottom: 6,
                  }}>
                    {tr(attr.descKey, attr.description)}
                  </div>
                  <div style={{
                    display: 'flex', gap: 8,
                    fontFamily: t.mono, fontSize: 9, color: t.textMuted,
                  }}>
                    <span>{tr('attributes.base', 'Base: {n}').replace('{n}', String(baseVal))}</span>
                    <span style={{ color: bonusVal > 0 ? t.mint : t.textMuted }}>
                      {bonusVal > 0 ? tr('attributes.equip_bonus', 'Equip: +{n}').replace('{n}', String(bonusVal)) : tr('attributes.equip_none', 'Equip: —')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
