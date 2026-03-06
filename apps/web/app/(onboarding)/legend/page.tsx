'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingV2Store, useNarrativeStore } from '@plan2skill/store';
import { t } from '../_components/tokens';
import { trpc } from '@plan2skill/api-client';
import { parseArt, PixelCanvas } from '../_components/PixelEngine';
import { charArtStrings, charPalettes } from '../_components/characters';

// ═══════════════════════════════════════════
// ONBOARDING LEGEND — 3-screen mythical introduction
// Spec §10: ~30-45 seconds, max 2 sentences per screen
// Constitution: pixel art, inline styles, RPG vocab,
// skip button, a11y, reduced motion
// ═══════════════════════════════════════════

// Sage pixel art data
const sageArt = parseArt(charArtStrings.sage!, charPalettes.sage!);
const SAGE_COLOR = '#B8C4E0';
const GOLD_TINT = 'rgba(255,209,102,0.15)';

type LegendScreen = 0 | 1 | 2;

export default function LegendPage() {
  const router = useRouter();
  const { intent } = useOnboardingV2Store();
  const { completeLegend } = useNarrativeStore();
  const completeLegendMutation = trpc.narrative.completeLegend.useMutation();

  const [screen, setScreen] = useState<LegendScreen>(0);
  const [exiting, setExiting] = useState(false);

  // SSR-safe reduced motion (Constitution §7 — BLOCKER)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Determine next route based on stored intent
  const getNextRoute = useCallback(() => {
    switch (intent) {
      case 'know': return '/goal/direct';
      case 'explore_guided': return '/assessment';
      case 'career': return '/goal/career';
      default: return '/goal/direct';
    }
  }, [intent]);

  // Navigate to next step
  const navigateNext = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      router.push(getNextRoute());
    }, reducedMotion ? 0 : 200);
  }, [router, getNextRoute, reducedMotion]);

  // Complete legend with XP
  const handleComplete = useCallback(() => {
    completeLegend();
    completeLegendMutation.mutate();
    navigateNext();
  }, [completeLegend, completeLegendMutation, navigateNext]);

  // Skip legend — no XP
  const handleSkip = useCallback(() => {
    completeLegend();
    navigateNext();
  }, [completeLegend, navigateNext]);

  // Advance to next screen
  const handleContinue = useCallback(() => {
    if (screen < 2) {
      setScreen((s) => (s + 1) as LegendScreen);
    } else {
      handleComplete();
    }
  }, [screen, handleComplete]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      handleContinue();
    } else if (e.key === 'ArrowLeft' && screen > 0) {
      setScreen((s) => (s - 1) as LegendScreen);
    } else if (e.key === 'Escape') {
      handleSkip();
    }
  }, [handleContinue, handleSkip, screen]);

  // Screen content
  const screens = [
    {
      title: 'The Realm of Lumen',
      text: 'Long ago, in the Realm of Lumen, knowledge was a living force called Lux. It flowed through every corner of the world, illuminating minds and shaping reality.',
      filter: 'none',
      particlesEnabled: false,
    },
    {
      title: 'The Dimming',
      text: 'Then came the Dimming. The Great Library shattered, its fragments scattered across five lands. Knowledge began to fade, and shadows crept where light once thrived.',
      filter: 'brightness(0.7) saturate(0.8)',
      particlesEnabled: true,
    },
    {
      title: 'Your Quest Begins',
      text: '',
      filter: 'none',
      particlesEnabled: false,
    },
  ];

  const current = screens[screen]!;

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`Legend screen ${screen + 1} of 3: ${current.title}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px 20px',
        background: t.bg,
        position: 'relative',
        overflow: 'hidden',
        animation: exiting
          ? (reducedMotion ? 'none' : 'fadeOut 0.2s ease forwards')
          : 'none',
      }}
    >
      {/* Skip button — always visible (Constitution §10: never forced story) */}
      <button
        onClick={handleSkip}
        aria-label="Skip legend introduction"
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: t.body,
          fontSize: 13,
          fontWeight: 500,
          color: t.textMuted,
          padding: '8px 12px',
          zIndex: 10,
        }}
      >
        Skip Legend &rarr;
      </button>

      {/* Progress dots */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 32,
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              width: i === screen ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === screen ? t.gold : `${t.textMuted}40`,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Ambient particles for Screen 2 (Micro tier, CSS-only) */}
      {current.particlesEnabled && !reducedMotion && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: `${t.gold}40`,
                left: `${15 + i * 14}%`,
                top: `${10 + (i % 3) * 25}%`,
                animation: `particleDrift ${3 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Illustration area */}
      <div style={{
        marginBottom: 24,
        filter: current.filter,
        transition: reducedMotion ? 'none' : 'filter 0.6s ease',
      }}>
        <div style={{
          animation: reducedMotion ? 'none' : 'npcBounce 3s ease-in-out infinite',
          filter: `drop-shadow(0 0 12px ${SAGE_COLOR}44)`,
        }}>
          <PixelCanvas data={sageArt} size={6} />
        </div>
      </div>

      {/* Title */}
      <h1
        key={`title-${screen}`}
        style={{
          fontFamily: t.display,
          fontSize: 24,
          fontWeight: 800,
          color: t.text,
          textAlign: 'center',
          marginBottom: 16,
          animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease',
        }}
      >
        {current.title}
      </h1>

      {/* Body text or NPC bubble */}
      <div
        key={`body-${screen}`}
        style={{
          maxWidth: 360,
          textAlign: 'center',
          marginBottom: 32,
          animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease 0.1s both',
        }}
      >
        {screen === 2 ? (
          // Screen 3: NPC bubble
          <>
            <p style={{
              fontFamily: t.body,
              fontSize: 15,
              color: t.textSecondary,
              lineHeight: 1.7,
              marginBottom: 20,
            }}>
              But heroes always rise. The Sage has been waiting for someone brave enough to restore what was lost.
            </p>
            <div style={{
              background: t.bgCard,
              borderRadius: '4px 16px 16px 16px',
              border: `1.5px solid ${t.gold}`,
              padding: '14px 18px',
              boxShadow: `0 0 12px ${GOLD_TINT}`,
              textAlign: 'left',
            }}>
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                color: SAGE_COLOR, letterSpacing: '0.04em',
                display: 'block', marginBottom: 6,
              }}>
                Sage
              </span>
              <p style={{
                fontFamily: t.body, fontSize: 14,
                color: t.text, lineHeight: 1.5, margin: 0,
              }}>
                &ldquo;Welcome, hero. I knew you&apos;d come. Every journey through knowledge begins with a single step &mdash; and yours starts now.&rdquo;
              </p>
            </div>
          </>
        ) : (
          <p style={{
            fontFamily: t.body,
            fontSize: 15,
            color: t.textSecondary,
            lineHeight: 1.7,
            margin: 0,
          }}>
            {current.text}
          </p>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={handleContinue}
        style={{
          background: screen === 2
            ? 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)'
            : t.bgCard,
          border: screen === 2 ? 'none' : `1px solid ${t.border}`,
          borderRadius: 14,
          padding: '14px 32px',
          cursor: 'pointer',
          fontFamily: t.display,
          fontSize: 15,
          fontWeight: 700,
          color: t.text,
          minWidth: 200,
          transition: 'all 0.2s ease',
          animation: reducedMotion ? 'none' : 'fadeUp 0.4s ease 0.2s both',
        }}
      >
        {screen === 2 ? 'Begin My Journey' : 'Continue'}
      </button>

      {/* Screen 3: XP preview */}
      {screen === 2 && (
        <div style={{
          fontFamily: t.mono, fontSize: 11, fontWeight: 700,
          color: t.gold, marginTop: 12,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease 0.3s both',
        }}>
          +15 XP
        </div>
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes npcBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes particleDrift {
          0%, 100% { opacity: 0; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(30px); }
        }
      `}</style>
    </div>
  );
}
