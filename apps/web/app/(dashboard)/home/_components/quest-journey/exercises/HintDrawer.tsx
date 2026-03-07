'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { NPCInline } from '../../../../../(onboarding)/_components/NPCBubble';
import { useI18nStore } from '@plan2skill/store';

// ═══════════════════════════════════════════
// HINT DRAWER — 3-tier progressive hint system
// Tier 1: "Ask the Sage" (free)
// Tier 2: "Consult the Oracle" (costs 1 crystal)
// Tier 3: "Reveal Answer Scroll" (locked until 1+ attempt)
// ═══════════════════════════════════════════

interface HintDrawerProps {
  hints: string[];
  energyCrystals: number;
  onConsumeCrystal?: () => void;
  answer: string;
  taskId: string;
}

export function HintDrawer({ hints, energyCrystals, onConsumeCrystal, answer, taskId }: HintDrawerProps) {
  const tr = useI18nStore((s) => s.t);
  const [revealedTier, setRevealedTier] = useState<0 | 1 | 2 | 3>(0);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Reset state when taskId changes (new exercise)
  useEffect(() => {
    setRevealedTier(0);
    setHasAttempted(false);
    setIsOpen(false);
  }, [taskId]);

  // Listen for attempts: parent can dispatch a custom event to signal an attempt
  useEffect(() => {
    const handler = () => setHasAttempted(true);
    window.addEventListener('exercise-attempt', handler);
    return () => window.removeEventListener('exercise-attempt', handler);
  }, []);

  const revealTier1 = useCallback(() => {
    if (revealedTier < 1) {
      setRevealedTier(1);
    }
  }, [revealedTier]);

  const revealTier2 = useCallback(() => {
    if (revealedTier < 2 && energyCrystals >= 1) {
      onConsumeCrystal?.();
      setRevealedTier(2);
    }
  }, [revealedTier, energyCrystals, onConsumeCrystal]);

  const revealTier3 = useCallback(() => {
    if (revealedTier < 3 && hasAttempted) {
      setRevealedTier(3);
    }
  }, [revealedTier, hasAttempted]);

  const hint1Text = hints[0] ?? tr('exercise.hint.generic', 'Think about the key concepts covered in the lesson.');
  const hint2Text = hints[1] ?? tr('exercise.hint.deeper', 'Review the examples and try a different approach.');

  return (
    <div style={{ marginTop: 8 }}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: '6px 12px',
          fontFamily: t.body,
          fontSize: 12,
          color: t.violet,
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = t.violet;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = t.border;
        }}
      >
        <NeonIcon type="book" size={14} color="violet" />
        {isOpen
          ? tr('exercise.hint.hide', 'Hide Hints')
          : tr('exercise.hint.show', 'Need a Hint?')}
      </button>

      {/* Hint drawer content */}
      {isOpen && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: reducedMotion ? 'none' : 'fadeUp 0.25s ease-out',
          }}
        >
          {/* Tier 1: Ask the Sage — free */}
          <div
            style={{
              background: t.bgElevated,
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              padding: 12,
            }}
          >
            <button
              onClick={revealTier1}
              disabled={revealedTier >= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: t.body,
                fontSize: 13,
                fontWeight: 600,
                color: revealedTier >= 1 ? t.textMuted : t.cyan,
                cursor: revealedTier >= 1 ? 'default' : 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <NeonIcon type="compass" size={16} color={revealedTier >= 1 ? 'muted' : 'cyan'} />
              {tr('exercise.hint.tier1', 'Ask the Sage')}
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: t.mint,
                }}
              >
                {tr('exercise.hint.free', 'FREE')}
              </span>
            </button>
            {revealedTier >= 1 && (
              <div
                style={{
                  marginTop: 8,
                  animation: reducedMotion ? 'none' : 'fadeUp 0.2s ease-out',
                }}
              >
                <NPCInline characterId="sage" message={hint1Text} emotion="thinking" />
              </div>
            )}
          </div>

          {/* Tier 2: Consult the Oracle — costs 1 crystal */}
          <div
            style={{
              background: t.bgElevated,
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              padding: 12,
              opacity: revealedTier < 1 ? 0.5 : 1,
            }}
          >
            <button
              onClick={revealTier2}
              disabled={revealedTier < 1 || revealedTier >= 2 || energyCrystals < 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: t.body,
                fontSize: 13,
                fontWeight: 600,
                color:
                  revealedTier >= 2
                    ? t.textMuted
                    : revealedTier < 1 || energyCrystals < 1
                      ? t.textMuted
                      : t.gold,
                cursor:
                  revealedTier < 1 || revealedTier >= 2 || energyCrystals < 1
                    ? 'default'
                    : 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <NeonIcon
                type="gem"
                size={16}
                color={revealedTier >= 2 ? 'muted' : revealedTier < 1 || energyCrystals < 1 ? 'muted' : 'gold'}
              />
              {tr('exercise.hint.tier2', 'Consult the Oracle')}
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: energyCrystals < 1 ? t.rose : t.gold,
                }}
              >
                <NeonIcon type="crystalFull" size={12} color={energyCrystals < 1 ? 'rose' : 'gold'} />
                1
              </span>
            </button>
            {revealedTier >= 2 && (
              <div
                style={{
                  marginTop: 8,
                  animation: reducedMotion ? 'none' : 'fadeUp 0.2s ease-out',
                }}
              >
                <NPCInline characterId="sage" message={hint2Text} emotion="impressed" />
              </div>
            )}
          </div>

          {/* Tier 3: Reveal Answer Scroll — locked until attempt */}
          <div
            style={{
              background: t.bgElevated,
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              padding: 12,
              opacity: revealedTier < 2 ? 0.5 : 1,
            }}
          >
            <button
              onClick={revealTier3}
              disabled={revealedTier < 2 || revealedTier >= 3 || !hasAttempted}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: t.body,
                fontSize: 13,
                fontWeight: 600,
                color:
                  revealedTier >= 3
                    ? t.textMuted
                    : revealedTier < 2 || !hasAttempted
                      ? t.textMuted
                      : t.rose,
                cursor:
                  revealedTier < 2 || revealedTier >= 3 || !hasAttempted
                    ? 'default'
                    : 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <NeonIcon
                type="scroll"
                size={16}
                color={revealedTier >= 3 ? 'muted' : revealedTier < 2 || !hasAttempted ? 'muted' : 'rose'}
              />
              {tr('exercise.hint.tier3', 'Reveal Answer Scroll')}
              {!hasAttempted && revealedTier >= 2 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: t.mono,
                    fontSize: 10,
                    color: t.textMuted,
                  }}
                >
                  {tr('exercise.hint.needAttempt', 'Attempt first')}
                </span>
              )}
            </button>
            {revealedTier >= 3 && (
              <div
                style={{
                  marginTop: 8,
                  animation: reducedMotion ? 'none' : 'fadeUp 0.2s ease-out',
                }}
              >
                <div
                  style={{
                    background: `${t.rose}08`,
                    borderRadius: 8,
                    border: `1px solid ${t.rose}20`,
                    padding: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 10,
                      fontWeight: 600,
                      color: t.rose,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    {tr('exercise.hint.answer', 'Answer')}
                  </span>
                  <p
                    style={{
                      fontFamily: t.body,
                      fontSize: 13,
                      color: t.text,
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Utility to signal an exercise attempt (call from exercise components) */
export function signalAttempt() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('exercise-attempt'));
  }
}
