'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { ParsonsExercise as ParsonsExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// PARSONS EXERCISE — Reorder shuffled code lines
// Same Up/Down button pattern as DragDrop
// Language badge, highlights misplaced lines
// ═══════════════════════════════════════════

interface ParsonsExerciseProps {
  exercise: ParsonsExerciseType;
  onAnswer: (correct: boolean) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    const jItem = result[j];
    if (tmp !== undefined && jItem !== undefined) {
      result[i] = jItem;
      result[j] = tmp;
    }
  }
  return result;
}

export function ParsonsExercise({ exercise, onAnswer }: ParsonsExerciseProps) {
  const tr = useI18nStore((s) => s.t);
  const [lines, setLines] = useState<string[]>(() => shuffleArray(exercise.codeLines));
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Per-line correctness after submit
  const lineResults = useMemo(() => {
    if (!submitted) return null;
    return lines.map((line, index) => {
      const correctLine = exercise.correctOrder[index];
      return line === correctLine;
    });
  }, [submitted, lines, exercise.correctOrder]);

  const moveLine = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (submitted) return;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= lines.length) return;

      setLines((prev) => {
        const next = [...prev];
        const currentItem = next[index];
        const swapItem = next[newIndex];
        if (currentItem !== undefined && swapItem !== undefined) {
          next[index] = swapItem;
          next[newIndex] = currentItem;
        }
        return next;
      });
    },
    [submitted, lines.length],
  );

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    signalAttempt();

    const correct = lines.every((line, index) => {
      const correctLine = exercise.correctOrder[index];
      return line === correctLine;
    });

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);
  }, [submitted, lines, exercise.correctOrder]);

  const handleContinue = useCallback(() => {
    onAnswer(isCorrect);
  }, [isCorrect, onAnswer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header: language badge + instructions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <NeonIcon type="code" size={16} color="mint" />
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 11,
            fontWeight: 600,
            color: t.mint,
            background: `${t.mint}12`,
            padding: '2px 8px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {exercise.language}
        </span>
        <span
          style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.textMuted,
            marginLeft: 4,
          }}
        >
          {tr('exercise.parsons.instructions', 'Arrange the code lines in the correct order.')}
        </span>
      </div>

      {/* Code lines list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          background: t.bgElevated,
          borderRadius: 10,
          border: `1px solid ${t.border}`,
          padding: 10,
        }}
      >
        {lines.map((line, index) => {
          const result = lineResults?.[index];

          let borderColor: string = `${t.border}60`;
          let lineNumColor: string = t.textMuted;

          if (result === true) {
            borderColor = `${t.cyan}60`;
            lineNumColor = t.cyan;
          } else if (result === false) {
            borderColor = `${t.rose}60`;
            lineNumColor = t.rose;
          }

          return (
            <div
              key={`${line}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 6,
                border: `1px solid ${borderColor}`,
                background: result === true
                  ? `${t.cyan}06`
                  : result === false
                    ? `${t.rose}06`
                    : 'transparent',
                transition: reducedMotion ? 'none' : 'all 0.15s ease',
              }}
            >
              {/* Line number */}
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: lineNumColor,
                  width: 18,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>

              {/* Code line */}
              <code
                style={{
                  flex: 1,
                  fontFamily: t.mono,
                  fontSize: 12,
                  color: t.text,
                  lineHeight: 1.5,
                  whiteSpace: 'pre',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {line}
              </code>

              {/* Result icon */}
              {result !== undefined && result !== null && (
                <NeonIcon
                  type={result ? 'check' : 'close'}
                  size={12}
                  color={result ? 'cyan' : 'rose'}
                />
              )}

              {/* Arrow buttons */}
              {!submitted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                  <button
                    onClick={() => moveLine(index, 'up')}
                    disabled={index === 0}
                    aria-label={tr('exercise.parsons.moveUp', 'Move up')}
                    style={{
                      width: 20,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: `1px solid ${index === 0 ? `${t.border}40` : t.border}`,
                      borderRadius: 3,
                      color: index === 0 ? t.textMuted : t.textSecondary,
                      cursor: index === 0 ? 'default' : 'pointer',
                      fontFamily: t.mono,
                      fontSize: 8,
                      padding: 0,
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveLine(index, 'down')}
                    disabled={index === lines.length - 1}
                    aria-label={tr('exercise.parsons.moveDown', 'Move down')}
                    style={{
                      width: 20,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: `1px solid ${index === lines.length - 1 ? `${t.border}40` : t.border}`,
                      borderRadius: 3,
                      color: index === lines.length - 1 ? t.textMuted : t.textSecondary,
                      cursor: index === lines.length - 1 ? 'default' : 'pointer',
                      fontFamily: t.mono,
                      fontSize: 8,
                      padding: 0,
                    }}
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          style={{
            alignSelf: 'flex-start',
            background: t.violet,
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontFamily: t.body,
            fontSize: 13,
            fontWeight: 600,
            color: t.bg,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {tr('exercise.submit', 'Submit')}
        </button>
      )}

      {/* Feedback */}
      {showFeedback && (
        <FeedbackPanel
          correct={isCorrect}
          explanation={exercise.explanation}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
