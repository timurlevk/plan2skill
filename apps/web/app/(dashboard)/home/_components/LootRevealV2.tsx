'use client';

import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { lootRevealMachine } from '../_machines/loot-reveal.machine';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import type { LootDrop } from '@plan2skill/types';

// ═══════════════════════════════════════════
// LOOT REVEAL V2 — Driven by lootRevealMachine
// Phases: chest glow → card flip → item reveal → claim
// UX-R164: Macro animations interruptible
// ═══════════════════════════════════════════

const RARITY_GLOW: Record<string, { color: string; intensity: number; icon: string; label: string }> = {
  common:    { color: '#71717A', intensity: 0.2, icon: '●',  label: 'Common' },
  uncommon:  { color: '#6EE7B7', intensity: 0.4, icon: '◆',  label: 'Uncommon' },
  rare:      { color: '#3B82F6', intensity: 0.6, icon: '⬡',  label: 'Rare' },
  epic:      { color: '#9D7AFF', intensity: 0.8, icon: '◈',  label: 'Epic' },
  legendary: { color: '#FFD166', intensity: 1.0, icon: '★',  label: 'Legendary' },
};

interface LootRevealV2Props {
  lootDrop: LootDrop | null;
  onClaim: () => void;
}

export function LootRevealV2({ lootDrop, onClaim }: LootRevealV2Props) {
  const [state, send] = useMachine(lootRevealMachine);

  // Trigger reveal when lootDrop arrives
  useEffect(() => {
    if (lootDrop && state.matches('hidden')) {
      send({ type: 'TRIGGER', item: lootDrop });
    }
  }, [lootDrop, state, send]);

  // Not showing anything in hidden state
  if (state.matches('hidden') || !state.context.item) return null;

  const item = state.context.item;
  const rarityConfig = RARITY_GLOW[item.rarity] ?? RARITY_GLOW.common!;
  const isTeasing = state.matches('teasing');
  const isRevealing = state.matches('revealing');
  const isRevealed = state.matches('revealed');
  const isClaimed = state.matches('claimed');

  // prefers-reduced-motion: skip straight to revealed
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion && (isTeasing || isRevealing)) {
    send({ type: 'SKIP' });
  }

  return (
    <div
      role="dialog"
      aria-label="Loot dropped!"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeUp 0.3s ease-out',
      }}
      onClick={() => {
        if (isTeasing || isRevealing) send({ type: 'SKIP' });
      }}
    >
      <div style={{
        width: 320, padding: 32, borderRadius: 24, textAlign: 'center',
        background: t.bgCard, border: `1px solid ${rarityConfig.color}40`,
        boxShadow: `0 0 ${40 * rarityConfig.intensity}px ${rarityConfig.color}30`,
        animation: isRevealing ? 'cardFlip 1.5s ease-out' : 'bounceIn 0.4s ease-out',
      }}>
        {/* Teasing state — chest glow */}
        {isTeasing && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              width: 80, height: 80, margin: '0 auto', borderRadius: 20,
              background: `radial-gradient(circle, ${rarityConfig.color}40 0%, transparent 70%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'glowPulse 1s ease-in-out infinite',
            }}>
              <NeonIcon type="gift" size={40} color={rarityConfig.color} />
            </div>
            <p style={{ fontFamily: t.display, fontSize: 16, fontWeight: 700, color: t.text, marginTop: 12 }}>
              Something is forging...
            </p>
            <p style={{ fontFamily: t.body, fontSize: 11, color: t.textMuted, marginTop: 4 }}>
              Tap to skip
            </p>
          </div>
        )}

        {/* Revealing / Revealed / Claimed — show item */}
        {(isRevealing || isRevealed || isClaimed) && (
          <>
            {/* Rarity badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', borderRadius: 20, marginBottom: 16,
              background: `${rarityConfig.color}15`, border: `1px solid ${rarityConfig.color}40`,
            }}>
              <span style={{ fontFamily: t.mono, fontSize: 14, color: rarityConfig.color }}>
                {rarityConfig.icon}
              </span>
              <span style={{ fontFamily: t.mono, fontSize: 11, fontWeight: 800, color: rarityConfig.color, textTransform: 'uppercase' }}>
                {rarityConfig.label}
              </span>
            </div>

            {/* Item icon placeholder */}
            <div style={{
              width: 72, height: 72, margin: '0 auto 12px', borderRadius: 16,
              background: `${rarityConfig.color}12`, border: `2px solid ${rarityConfig.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: isRevealed ? 'celebratePop 0.7s ease-out' : 'none',
            }}>
              <NeonIcon type="gem" size={36} color={rarityConfig.color} />
            </div>

            {/* Item name */}
            <h3 style={{
              fontFamily: t.display, fontSize: 20, fontWeight: 900,
              color: t.text, marginBottom: 4,
            }}>
              {item.name}
            </h3>

            {/* Item description */}
            <p style={{
              fontFamily: t.body, fontSize: 12, color: t.textSecondary,
              lineHeight: 1.5, marginBottom: 8, maxWidth: 260, margin: '0 auto 8px',
            }}>
              {item.description}
            </p>

            {/* Slot */}
            <div style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: t.textMuted, textTransform: 'uppercase', marginBottom: 12,
            }}>
              {item.slot}
            </div>

            {/* Attribute bonuses */}
            {Object.entries(item.attributeBonus).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                {Object.entries(item.attributeBonus).map(([key, val]) => (
                  <div key={key} style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: `${t.violet}12`,
                  }}>
                    <span style={{ fontFamily: t.mono, fontSize: 10, fontWeight: 800, color: t.mint }}>
                      +{val} {key}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Claim button */}
            {isRevealed && (
              <button
                onClick={() => {
                  send({ type: 'CLAIM' });
                  onClaim();
                }}
                style={{
                  padding: '12px 32px', borderRadius: 14, border: 'none',
                  background: `linear-gradient(135deg, ${rarityConfig.color}, ${t.violet})`,
                  fontFamily: t.display, fontSize: 14, fontWeight: 800,
                  color: '#FFF', cursor: 'pointer',
                  boxShadow: `0 4px 16px ${rarityConfig.color}40`,
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Claim Artifact
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
