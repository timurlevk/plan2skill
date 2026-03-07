'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { TrueFalseExercise as TrueFalseExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// TRUE/FALSE EXERCISE — Binary choice exercise
// Two large buttons side by side with clear feedback
// ═══════════════════════════════════════════

interface TrueFalseExerciseProps {
  exercise: TrueFalseExerciseType;
  onAnswer: (correct: boolean) => void;
}

export function TrueFalseExercise({ exercise, onAnswer }: TrueFalseExerciseProps) {
  const tr = useI18nStore((s) => s.t);
  const [selected, setSelected] = useState<boolean | null>(null);
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    (value: boolean) => {
      if (selected !== null) return;
      setSelected(value);
      signalAttempt();

      timerRef.current = setTimeout(
        () => {
          setShowFeedback(true);
        },
        reducedMotion ? 0 : 400,
      );
    },
    [selected, reducedMotion],
  );

  const handleContinue = useCallback(() => {
    if (selected === null) return;
    onAnswer(selected === exercise.correctAnswer);
  }, [selected, exercise.correctAnswer, onAnswer]);

  const getButtonStyle = (value: boolean): React.CSSProperties => {
    const isSelected = selected === value;
    const isAnswered = selected !== null;
    const isCorrectValue = value === exercise.correctAnswer;

    let borderColor: string = t.border;
    let bgColor: string = t.bgElevated;
    let color: string = t.text;
    let shadow: string = 'none';

    if (isAnswered) {
      if (isCorrectValue) {
        borderColor = t.cyan;
        bgColor = `${t.cyan}10`;
        color = t.cyan;
        shadow = `0 0 8px ${t.cyan}20`;
      } else if (isSelected && !isCorrectValue) {
        borderColor = t.rose;
        bgColor = `${t.rose}10`;
        color = t.rose;
      } else {
        borderColor = `${t.border}60`;
        color = t.textMuted;
      }
    }

    return {
      flex: 1,
      padding: '16px 20px',
      background: bgColor,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 12,
      fontFamily: t.display,
      fontSize: 16,
      fontWeight: 700,
      color,
      cursor: isAnswered ? 'default' : 'pointer',
      transition: reducedMotion ? 'none' : 'all 0.2s ease',
      boxShadow: shadow,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      animation:
        isAnswered && isSelected && !isCorrectValue && !reducedMotion
          ? 'shake 0.4s ease-in-out'
          : 'none',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Statement */}
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
        {exercise.statement}
      </p>

      {/* True / False buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => handleSelect(true)}
          disabled={selected !== null}
          style={getButtonStyle(true)}
          onMouseEnter={(e) => {
            if (selected === null) {
              e.currentTarget.style.borderColor = t.mint;
              e.currentTarget.style.background = `${t.mint}08`;
            }
          }}
          onMouseLeave={(e) => {
            if (selected === null) {
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.background = t.bgElevated;
            }
          }}
        >
          {selected !== null && true === exercise.correctAnswer && (
            <NeonIcon type="check" size={18} color="cyan" />
          )}
          {selected === true && true !== exercise.correctAnswer && (
            <NeonIcon type="close" size={18} color="rose" />
          )}
          {tr('exercise.true', 'True')}
        </button>

        <button
          onClick={() => handleSelect(false)}
          disabled={selected !== null}
          style={getButtonStyle(false)}
          onMouseEnter={(e) => {
            if (selected === null) {
              e.currentTarget.style.borderColor = t.rose;
              e.currentTarget.style.background = `${t.rose}08`;
            }
          }}
          onMouseLeave={(e) => {
            if (selected === null) {
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.background = t.bgElevated;
            }
          }}
        >
          {selected !== null && false === exercise.correctAnswer && (
            <NeonIcon type="check" size={18} color="cyan" />
          )}
          {selected === false && false !== exercise.correctAnswer && (
            <NeonIcon type="close" size={18} color="rose" />
          )}
          {tr('exercise.false', 'False')}
        </button>
      </div>

      {/* Feedback */}
      {showFeedback && selected !== null && (
        <FeedbackPanel
          correct={selected === exercise.correctAnswer}
          explanation={exercise.explanation}
          onContinue={handleContinue}
        />
      )}

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
