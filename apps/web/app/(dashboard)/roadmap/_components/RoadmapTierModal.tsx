'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// ROADMAP TIER MODAL — Premium Gate
// Shows when free/pro user hits their roadmap limit
// UX-R141: Positive framing, no confirmshaming
// Крок 10: Ethical — "Not now" neutral, no urgency
// ═══════════════════════════════════════════

const TIER_DISPLAY: Record<string, { name: string; icon: string; color: string }> = {
  free: { name: 'Adventurer', icon: '⚔️', color: t.textMuted },
  pro: { name: 'Hero', icon: '🛡️', color: t.violet },
  champion: { name: 'Legend', icon: '👑', color: t.gold },
};

interface RoadmapTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierInfo: { tier: string; current: number; limit: number };
}

export function RoadmapTierModal({ isOpen, onClose, tierInfo }: RoadmapTierModalProps) {
  // SSR-safe reduced-motion (Крок 7 rule 3)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Focus trap ref
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const currentTier = TIER_DISPLAY[tierInfo.tier] ?? TIER_DISPLAY.free!;
  const isFreeTier = tierInfo.tier === 'free';

  // Attribute pitch data — mini bars showing what new quest lines unlock
  const attributePitch = [
    { name: 'STR', fill: 0.9, color: '#FF6B8A' },
    { name: 'DEX', fill: 0.3, color: '#4ECDC4' },
    { name: 'WIS', fill: 0.25, color: '#9D7AFF' },
    { name: 'INT', fill: 0.4, color: '#3B82F6' },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: reducedMotion ? 'none' : 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      {/* Dialog card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade your quest book"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{
          maxWidth: 440, width: '90vw',
          padding: 28, borderRadius: 20,
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${t.violet}10`,
          outline: 'none',
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}
      >
        {/* Crown icon */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: `${t.gold}12`,
            border: `1px solid ${t.gold}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <NeonIcon type="crown" size={28} color="gold" active />
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: t.display, fontSize: 20, fontWeight: 900,
          color: t.text, textAlign: 'center', marginBottom: 6,
        }}>
          Your quest book is full!
        </h2>

        {/* Subtitle */}
        <p style={{
          fontFamily: t.body, fontSize: 14, color: t.textSecondary,
          textAlign: 'center', marginBottom: 20, lineHeight: 1.5,
        }}>
          {tierInfo.current}/{tierInfo.limit} active quest lines on the{' '}
          <span style={{ color: currentTier.color, fontWeight: 700 }}>
            {currentTier.icon} {currentTier.name}
          </span>{' '}
          path
        </p>

        {/* Attribute pitch card */}
        <div style={{
          padding: 16, borderRadius: 14,
          background: t.bgElevated, border: `1px solid ${t.border}`,
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: t.display, fontSize: 11, fontWeight: 700,
            color: t.textMuted, textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 10,
          }}>
            New quest lines grow different attributes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attributePitch.map((attr) => (
              <div key={attr.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: t.textMuted, width: 28,
                }}>
                  {attr.name}
                </span>
                <div style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: `${attr.color}15`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${attr.fill * 100}%`, height: '100%',
                    borderRadius: 3, background: attr.color,
                    transition: 'width 0.6s ease-out',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier comparison */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          marginBottom: 20,
        }}>
          {/* Pro tier */}
          <div style={{
            padding: 14, borderRadius: 12,
            background: isFreeTier ? `${t.violet}08` : t.bgElevated,
            border: `1.5px solid ${isFreeTier ? `${t.violet}40` : t.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: t.display, fontSize: 11, fontWeight: 700,
              color: t.violet, marginBottom: 4,
            }}>
              🛡️ Hero
            </div>
            <div style={{
              fontFamily: t.display, fontSize: 24, fontWeight: 900,
              color: t.text,
            }}>
              7
            </div>
            <div style={{
              fontFamily: t.body, fontSize: 10, color: t.textMuted,
            }}>
              quest lines
            </div>
          </div>

          {/* Champion tier */}
          <div style={{
            padding: 14, borderRadius: 12,
            background: `${t.gold}06`,
            border: `1.5px solid ${t.gold}20`,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: t.display, fontSize: 11, fontWeight: 700,
              color: t.gold, marginBottom: 4,
            }}>
              👑 Legend
            </div>
            <div style={{
              fontFamily: t.display, fontSize: 24, fontWeight: 900,
              color: t.text,
            }}>
              15
            </div>
            <div style={{
              fontFamily: t.body, fontSize: 10, color: t.textMuted,
            }}>
              quest lines
            </div>
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={() => {
            // TODO: Route to /pricing or Stripe checkout
            onClose();
          }}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 12,
            background: t.gradient, border: 'none',
            cursor: 'pointer',
            fontFamily: t.display, fontSize: 15, fontWeight: 700,
            color: '#FFF',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Try Pro Free — 7 Days
        </button>

        {/* Dismiss — UX-R141: neutral, no confirmshaming */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px 24px', marginTop: 8,
            background: 'none', border: 'none',
            cursor: 'pointer',
            fontFamily: t.display, fontSize: 13, fontWeight: 600,
            color: t.textMuted,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = t.textSecondary; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; }}
        >
          Not now
        </button>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
