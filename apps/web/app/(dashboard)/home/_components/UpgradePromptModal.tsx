'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTeaser: string;
  requiredTier: string;
}

export function UpgradePromptModal({ isOpen, onClose, featureTeaser, requiredTier }: UpgradePromptModalProps) {
  const tr = useI18nStore((s) => s.t);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const tierName = requiredTier === 'champion' ? 'Legend' : 'Hero';
  const tierIcon = requiredTier === 'champion' ? '\uD83D\uDC51' : '\uD83D\uDEE1\uFE0F';

  const features = requiredTier === 'champion'
    ? [
        tr('upgrade.unlimited_ai', 'Unlimited AI tutoring'),
        tr('upgrade.all_content', 'All premium content unlocked'),
        tr('upgrade.priority', 'Priority generation queue'),
        tr('upgrade.no_limits', 'No daily limits'),
      ]
    : [
        tr('upgrade.ai_tutor', 'AI tutor with personalized feedback'),
        tr('upgrade.resources', 'Curated learning resources'),
        tr('upgrade.code_challenges', 'Interactive code challenges'),
        tr('upgrade.fun_facts', 'Fun facts & deep insights'),
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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={tr('upgrade.title', 'Unlock Premium Features')}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{
          maxWidth: 420, width: '90vw',
          padding: 28, borderRadius: 20,
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${t.gold}10`,
          outline: 'none',
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}
      >
        {/* Crown icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
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
          {tr('upgrade.title', 'Unlock Premium Features')}
        </h2>

        {/* Teaser text */}
        <p style={{
          fontFamily: t.body, fontSize: 14, color: t.textSecondary,
          textAlign: 'center', marginBottom: 20, lineHeight: 1.5,
        }}>
          {featureTeaser}
        </p>

        {/* Target tier features */}
        <div style={{
          padding: 16, borderRadius: 14,
          background: t.bgElevated, border: `1px solid ${t.border}`,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: t.display, fontSize: 11, fontWeight: 700,
            color: t.gold, textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 10,
          }}>
            {tierIcon} {tierName} {tr('upgrade.tier_includes', 'tier includes')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {features.map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: t.gold, fontSize: 12, flexShrink: 0 }}>✦</span>
                <span style={{
                  fontFamily: t.body, fontSize: 13, color: t.text,
                }}>
                  {feat}
                </span>
              </div>
            ))}
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
          {tr('upgrade.cta', 'Try Pro Free \u2014 7 Days')}
        </button>

        {/* Dismiss */}
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
          {tr('upgrade.not_now', 'Not now')}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
