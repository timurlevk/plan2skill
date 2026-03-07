'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { DragDropExercise as DragDropExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// DRAG DROP EXERCISE — Reorder items via Up/Down buttons
// Pointer-accessible, no drag library needed
// ═══════════════════════════════════════════

interface DragDropExerciseProps {
  exercise: DragDropExerciseType;
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

export function DragDropExercise({ exercise, onAnswer }: DragDropExerciseProps) {
  const tr = useI18nStore((s) => s.t);
  const [items, setItems] = useState<string[]>(() => shuffleArray(exercise.items));
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

  // Per-item correctness after submit
  const itemResults = useMemo(() => {
    if (!submitted) return null;
    return items.map((item, index) => {
      const correctItem = exercise.correctOrder[index];
      return item === correctItem;
    });
  }, [submitted, items, exercise.correctOrder]);

  const moveItem = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (submitted) return;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return;

      setItems((prev) => {
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
    [submitted, items.length],
  );

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    signalAttempt();

    const correct = items.every((item, index) => {
      const correctItem = exercise.correctOrder[index];
      return item === correctItem;
    });

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);
  }, [submitted, items, exercise.correctOrder]);

  const handleContinue = useCallback(() => {
    onAnswer(isCorrect);
  }, [isCorrect, onAnswer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Instructions */}
      <p
        style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          margin: 0,
        }}
      >
        {tr('exercise.dragDrop.instructions', 'Arrange the items in the correct order using the arrow buttons.')}
      </p>

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, index) => {
          const result = itemResults?.[index];

          let borderColor: string = t.border;
          let bgColor: string = t.bgElevated;

          if (result === true) {
            borderColor = t.cyan;
            bgColor = `${t.cyan}08`;
          } else if (result === false) {
            borderColor = t.rose;
            bgColor = `${t.rose}08`;
          }

          return (
            <div
              key={`${item}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 8,
                transition: reducedMotion ? 'none' : 'all 0.15s ease',
              }}
            >
              {/* Position number */}
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  color: result === true ? t.cyan : result === false ? t.rose : t.textMuted,
                  width: 20,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>

              {/* Item text */}
              <span
                style={{
                  flex: 1,
                  fontFamily: t.body,
                  fontSize: 13,
                  color: t.text,
                  lineHeight: 1.4,
                }}
              >
                {item}
              </span>

              {/* Result icon */}
              {result !== undefined && result !== null && (
                <NeonIcon
                  type={result ? 'check' : 'close'}
                  size={14}
                  color={result ? 'cyan' : 'rose'}
                />
              )}

              {/* Arrow buttons */}
              {!submitted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    aria-label={tr('exercise.dragDrop.moveUp', 'Move up')}
                    style={{
                      width: 24,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: `1px solid ${index === 0 ? `${t.border}60` : t.border}`,
                      borderRadius: 4,
                      color: index === 0 ? t.textMuted : t.textSecondary,
                      cursor: index === 0 ? 'default' : 'pointer',
                      fontFamily: t.mono,
                      fontSize: 10,
                      padding: 0,
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    aria-label={tr('exercise.dragDrop.moveDown', 'Move down')}
                    style={{
                      width: 24,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: `1px solid ${index === items.length - 1 ? `${t.border}60` : t.border}`,
                      borderRadius: 4,
                      color: index === items.length - 1 ? t.textMuted : t.textSecondary,
                      cursor: index === items.length - 1 ? 'default' : 'pointer',
                      fontFamily: t.mono,
                      fontSize: 10,
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
