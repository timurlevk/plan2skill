'use client';

import React, { useState, useEffect, useRef } from 'react';
import { t } from '../../../../(onboarding)/_components/tokens';

// ═══════════════════════════════════════════
// MINI FORGE — 5s anvil animation for /roadmap/new
// Macro tier >1200ms → MUST be interruptible (Крок 7 rule 4)
// §9: prefers-reduced-motion = BLOCKER
// §11: No over-celebration — 5s focused animation
// ═══════════════════════════════════════════

const PHASES = [
  { threshold: 0, text: 'Analyzing your quest...' },
  { threshold: 30, text: 'Forging milestones...' },
  { threshold: 60, text: 'Calibrating difficulty...' },
  { threshold: 90, text: 'Quest line ready!' },
] as const;

interface MiniForgeProps {
  isForging: boolean;
  onSkip?: () => void;
  /** External progress 0-100 from SSE. When provided, overrides internal timer. */
  progress?: number;
  /** External phase text from SSE. When provided, overrides PHASES lookup. */
  phase?: string;
}

export function MiniForge({ isForging, onSkip, progress: externalProgress, phase: externalPhase }: MiniForgeProps) {
  // SSR-safe reduced-motion (Крок 7 rule 3)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const [internalProgress, setInternalProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use external SSE progress when available, otherwise fall back to internal timer
  const useExternal = externalProgress !== undefined;
  const progress = useExternal ? externalProgress : internalProgress;

  // Internal timer: only runs if forging AND no external progress
  useEffect(() => {
    if (!isForging || useExternal) {
      setInternalProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isForging, useExternal]);

  // Phase text — prefer external phase, else derive from PHASES
  const derivedPhase = [...PHASES].reverse().find((p) => progress >= p.threshold) ?? PHASES[0];
  const currentPhaseText = externalPhase || derivedPhase.text;

  if (!isForging) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 20, padding: '32px 16px',
    }}>
      {/* Anvil + hammer animation */}
      <div style={{
        position: 'relative', width: 80, height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Anvil */}
        <div style={{
          fontSize: 48, lineHeight: 1,
          animation: reducedMotion ? 'none' : 'anvilShake 0.6s ease-in-out infinite',
        }}>
          🔨
        </div>

        {/* Spark particles — only when animating */}
        {!reducedMotion && [0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 4, height: 4, borderRadius: '50%',
              background: [t.gold, t.cyan, t.violet, t.rose][i],
              animation: `spark${['Up', 'Right', 'Left', 'Down'][i]} 0.8s ease-out infinite`,
              animationDelay: `${i * 0.15}s`,
              top: '50%', left: '50%',
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Phase text with shimmer */}
      <div style={{
        fontFamily: t.display, fontSize: 16, fontWeight: 700,
        color: t.text, textAlign: 'center',
        animation: reducedMotion ? 'none' : 'shimmer 2s linear infinite',
        backgroundImage: reducedMotion
          ? undefined
          : `linear-gradient(90deg, ${t.text}, ${t.violet}, ${t.text})`,
        backgroundSize: reducedMotion ? undefined : '200% 100%',
        WebkitBackgroundClip: reducedMotion ? undefined : 'text',
        WebkitTextFillColor: reducedMotion ? undefined : 'transparent',
      }}>
        {currentPhaseText}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%', maxWidth: 280, height: 6,
        borderRadius: 3, background: `${t.violet}15`,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`, height: '100%',
          borderRadius: 3,
          background: t.gradient,
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Progress % */}
      <span style={{
        fontFamily: t.mono, fontSize: 11, color: t.textMuted,
      }}>
        {Math.min(progress, 100)}%
      </span>

      {/* Skip button — Macro tier MUST be interruptible (Крок 7 rule 4) */}
      {onSkip && (
        <button
          onClick={onSkip}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: t.display, fontSize: 12, fontWeight: 600,
            color: t.textMuted, padding: '6px 12px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = t.textSecondary; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; }}
        >
          Tap to skip
        </button>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes anvilShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg) translateY(-3px); }
          50% { transform: rotate(0deg) translateY(0); }
          75% { transform: rotate(5deg); }
        }
        @keyframes sparkUp {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          100% { transform: translate(0, -30px) scale(0); opacity: 0; }
        }
        @keyframes sparkRight {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          100% { transform: translate(25px, -15px) scale(0); opacity: 0; }
        }
        @keyframes sparkLeft {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          100% { transform: translate(-25px, -15px) scale(0); opacity: 0; }
        }
        @keyframes sparkDown {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          100% { transform: translate(0, 20px) scale(0); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
