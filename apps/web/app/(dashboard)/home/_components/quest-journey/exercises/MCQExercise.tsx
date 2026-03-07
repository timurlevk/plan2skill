'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { MCQExercise as MCQExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// MCQ EXERCISE — Multiple Choice Question
// 4 options in vertical stack, selection feedback,
// auto-advance after showing result
// ═══════════════════════════════════════════

interface MCQExerciseProps {
  exercise: MCQExerciseType;
  onAnswer: (correct: boolean) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export function MCQExercise({ exercise, onAnswer }: MCQExerciseProps) {
  const tr = useI18nStore((s) => s.t);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (selected !== null) return; // already answered
      setSelected(index);
      signalAttempt();

      const isCorrect = index === exercise.correctIndex;

      // Show feedback after brief delay
      timerRef.current = setTimeout(() => {
        setShowFeedback(true);
      }, reducedMotion ? 0 : 400);
    },
    [selected, exercise.correctIndex, reducedMotion],
  );

  const handleContinue = useCallback(() => {
    if (selected === null) return;
    onAnswer(selected === exercise.correctIndex);
  }, [selected, exercise.correctIndex, onAnswer]);

  const getOptionStyle = (index: number): React.CSSProperties => {
    const isSelected = selected === index;
    const isCorrectOption = index === exercise.correctIndex;
    const isAnswered = selected !== null;

    let borderColor: string = t.border;
    let bgColor: string = t.bgElevated;
    let textColor: string = t.text;
    let shadow: string = 'none';

    if (isAnswered) {
      if (isCorrectOption) {
        borderColor = t.cyan;
        bgColor = `${t.cyan}10`;
        shadow = `0 0 8px ${t.cyan}20`;
      } else if (isSelected && !isCorrectOption) {
        borderColor = t.rose;
        bgColor = `${t.rose}10`;
        textColor = t.rose;
      } else {
        borderColor = `${t.border}60`;
        textColor = t.textMuted;
      }
    }

    return {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '12px 14px',
      background: bgColor,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 10,
      fontFamily: t.body,
      fontSize: 14,
      color: textColor,
      cursor: isAnswered ? 'default' : 'pointer',
      transition: reducedMotion ? 'none' : 'all 0.2s ease',
      boxShadow: shadow,
      animation:
        isAnswered && isSelected && !isCorrectOption && !reducedMotion
          ? 'shake 0.4s ease-in-out'
          : 'none',
      textAlign: 'left' as const,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Question */}
      <p
        style={{
          fontFamily: t.display,
          fontSize: 15,
          fontWeight: 600,
          color: t.text,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {exercise.question}
      </p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exercise.options.map((option, index) => {
          const label = OPTION_LABELS[index] ?? String(index + 1);
          const isSelected = selected === index;
          const isCorrectOption = index === exercise.correctIndex;
          const isAnswered = selected !== null;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
              style={getOptionStyle(index)}
              onMouseEnter={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.borderColor = t.violet;
                  e.currentTarget.style.background = `${t.violet}08`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.borderColor = t.border;
                  e.currentTarget.style.background = t.bgElevated;
                }
              }}
            >
              {/* Label badge */}
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: t.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background:
                    isAnswered && isCorrectOption
                      ? `${t.cyan}20`
                      : isAnswered && isSelected
                        ? `${t.rose}20`
                        : `${t.violet}12`,
                  color:
                    isAnswered && isCorrectOption
                      ? t.cyan
                      : isAnswered && isSelected
                        ? t.rose
                        : t.violet,
                }}
              >
                {isAnswered && isCorrectOption ? (
                  <NeonIcon type="check" size={14} color="cyan" />
                ) : isAnswered && isSelected ? (
                  <NeonIcon type="close" size={14} color="rose" />
                ) : (
                  label
                )}
              </span>

              {/* Option text */}
              <span style={{ flex: 1, lineHeight: 1.4 }}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && selected !== null && (
        <FeedbackPanel
          correct={selected === exercise.correctIndex}
          explanation={exercise.explanation}
          onContinue={handleContinue}
        />
      )}

      {/* Shake keyframe style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
