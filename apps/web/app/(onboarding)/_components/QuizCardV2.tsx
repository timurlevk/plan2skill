'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { t } from './tokens';

// ═══════════════════════════════════════════
// QUIZ CARD v2 — Gamified adaptive quiz card
// Duolingo-style 3D pushable buttons
// Celebration particles on correct answer
// Encouraging "Not quite!" on wrong answer
// Streak multiplier visual
// ═══════════════════════════════════════════

interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

interface QuizCardV2Props {
  question: string;
  options: QuizOption[];
  onAnswer: (optionId: string, correct: boolean) => void;
  disabled?: boolean;
  streak?: number; // consecutive correct answers
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// Mini celebration particles
function CelebrationBurst({ color }: { color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i / 12) * 360,
      distance: 20 + Math.random() * 30,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 0.15,
    })),
    []
  );

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.distance;
        const y = Math.sin(rad) * p.distance;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: color,
              '--sx': `${x}px`,
              '--sy': `${y}px`,
              animation: `sparkBurst 0.6s ease-out ${p.delay}s both`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// Checkmark morph animation
function CheckmarkMorph() {
  return (
    <div style={{
      animation: 'celebratePop 0.4s ease-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill={t.cyan} opacity="0.2" />
        <path d="M6 10l3 3 5-6" stroke={t.cyan} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// Wrong answer X with bounce
function WrongMark() {
  return (
    <div style={{
      animation: 'bounceIn 0.4s ease-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill={t.rose} opacity="0.2" />
        <path d="M7 7l6 6M13 7l-6 6" stroke={t.rose} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function QuizCardV2({ question, options, onAnswer, disabled = false, streak = 0 }: QuizCardV2Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleSelect = (opt: QuizOption) => {
    if (disabled || selected) return;
    setSelected(opt.id);
    setRevealed(true);

    if (opt.correct && !reducedMotion) {
      setShowBurst(true);
    }

    setTimeout(() => {
      onAnswer(opt.id, opt.correct);
    }, 1000);
  };

  const selectedOpt = options.find((o) => o.id === selected);
  const wasCorrect = selectedOpt?.correct;

  return (
    <div style={{ position: 'relative' }}>
      {/* Streak multiplier badge */}
      {streak > 0 && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          borderRadius: 8,
          background: `${t.gold}15`,
          border: `1px solid ${t.gold}30`,
          marginBottom: 12,
          animation: reducedMotion ? 'none' : 'celebratePop 0.3s ease-out',
        }}>
          <span style={{
            fontFamily: t.mono,
            fontSize: 12,
            fontWeight: 800,
            color: t.gold,
          }}>
            {streak}× streak
          </span>
          {'🔥'.repeat(Math.min(streak, 3))}
        </div>
      )}

      {/* Question */}
      <h2 style={{
        fontFamily: t.display,
        fontSize: 20,
        fontWeight: 800,
        color: t.text,
        marginBottom: 16,
        lineHeight: 1.3,
      }}>
        {question}
      </h2>

      {/* Options — 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.correct;
          const showResult = revealed && (isSelected || (isCorrect && selected));
          const isDimmed = selected !== null && !isSelected && !isCorrect;

          let borderColor = t.border;
          let bgColor = t.bgCard;
          let bottomBorder = `4px solid #111118`;

          if (showResult && isSelected && isCorrect) {
            borderColor = t.cyan;
            bgColor = `${t.cyan}10`;
            bottomBorder = `2px solid ${t.cyan}`;
          } else if (showResult && isSelected && !isCorrect) {
            borderColor = t.rose;
            bgColor = `${t.rose}10`;
            bottomBorder = `2px solid ${t.rose}`;
          } else if (showResult && isCorrect) {
            borderColor = t.cyan;
            bgColor = `${t.cyan}08`;
          } else if (isSelected) {
            borderColor = t.violet;
            bgColor = `${t.violet}10`;
            bottomBorder = `2px solid ${t.violet}`;
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              disabled={disabled || selected !== null}
              aria-label={`Option ${OPTION_LETTERS[i]}: ${opt.text}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                padding: '10px 12px',
                borderRadius: 12,
                border: `2px solid ${borderColor}`,
                borderBottom: bottomBorder,
                background: bgColor,
                cursor: selected ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                transform: isSelected ? 'scale(0.97) translateY(2px)' : 'scale(1)',
                animation: reducedMotion
                  ? 'none'
                  : `fadeUp 0.35s ease-out ${i * 0.06}s both`,
                opacity: isDimmed ? 0.4 : 1,
                position: 'relative',
                minHeight: 0,
              }}
            >
              {/* Celebration burst on correct */}
              {showBurst && isSelected && isCorrect && (
                <CelebrationBurst color={t.cyan} />
              )}

              {/* Letter badge / result icon — top row */}
              <div style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                border: `2px solid ${showResult && isCorrect ? t.cyan : showResult && isSelected ? t.rose : t.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: t.mono,
                fontSize: 12,
                fontWeight: 800,
                color: showResult && isCorrect ? t.cyan : showResult && isSelected && !isCorrect ? t.rose : t.textSecondary,
                flexShrink: 0,
                transition: 'all 0.2s ease',
                background: showResult && isCorrect
                  ? `${t.cyan}15`
                  : showResult && isSelected && !isCorrect
                  ? `${t.rose}15`
                  : 'transparent',
              }}>
                {showResult && isCorrect ? <CheckmarkMorph /> :
                 showResult && isSelected && !isCorrect ? <WrongMark /> :
                 OPTION_LETTERS[i]}
              </div>

              {/* Text */}
              <span style={{
                fontFamily: t.body,
                fontSize: 13,
                fontWeight: 500,
                color: isDimmed ? t.textMuted : t.text,
                lineHeight: 1.35,
              }}>
                {opt.text}
              </span>

              {/* Correct indicator on correct (not selected) option */}
              {showResult && isCorrect && !isSelected && (
                <span style={{
                  fontFamily: t.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  color: t.cyan,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Correct
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Result feedback message */}
      {revealed && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 12,
          background: wasCorrect ? `${t.cyan}08` : `${t.rose}08`,
          border: `1px solid ${wasCorrect ? t.cyan : t.rose}20`,
          animation: reducedMotion ? 'none' : 'fadeUp 0.3s ease-out',
        }}>
          <p style={{
            fontFamily: t.display,
            fontSize: 14,
            fontWeight: 700,
            color: wasCorrect ? t.cyan : t.rose,
            marginBottom: 2,
          }}>
            {wasCorrect ? 'Well done, hero!' : 'Not quite!'}
          </p>
          <p style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.textSecondary,
          }}>
            {wasCorrect
              ? 'Your knowledge serves you well on this quest.'
              : 'Every hero learns from the journey — onward!'
            }
          </p>
        </div>
      )}
    </div>
  );
}
