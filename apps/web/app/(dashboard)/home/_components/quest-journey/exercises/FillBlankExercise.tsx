'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { FillBlankExercise as FillBlankExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// FILL BLANK EXERCISE — Sentence with inline input
// Compares input against acceptedAnswers (case-insensitive, trimmed)
// ═══════════════════════════════════════════

interface FillBlankExerciseProps {
  exercise: FillBlankExerciseType;
  onAnswer: (correct: boolean) => void;
}

export function FillBlankExercise({ exercise, onAnswer }: FillBlankExerciseProps) {
  const tr = useI18nStore((s) => s.t);
  const [inputValue, setInputValue] = useState('');
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

  // Split sentence at ___ to render inline input
  const sentenceParts = useMemo(() => {
    return exercise.sentence.split('___');
  }, [exercise.sentence]);

  const checkAnswer = useCallback(
    (answer: string): boolean => {
      const normalized = answer.trim().toLowerCase();
      return exercise.acceptedAnswers.some(
        (accepted) => accepted.trim().toLowerCase() === normalized,
      );
    },
    [exercise.acceptedAnswers],
  );

  const handleSubmit = useCallback(() => {
    if (submitted || inputValue.trim().length === 0) return;
    signalAttempt();
    const correct = checkAnswer(inputValue);
    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);
  }, [submitted, inputValue, checkAnswer]);

  const handleContinue = useCallback(() => {
    onAnswer(isCorrect);
  }, [isCorrect, onAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sentence with inline blank */}
      <div
        style={{
          fontFamily: t.display,
          fontSize: 15,
          fontWeight: 600,
          color: t.text,
          lineHeight: 2,
          margin: 0,
        }}
      >
        {sentenceParts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < sentenceParts.length - 1 && (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={submitted}
                placeholder={tr('exercise.fillBlank.placeholder', 'type answer...')}
                autoFocus={index === 0}
                style={{
                  display: 'inline-block',
                  width: Math.max(140, inputValue.length * 10 + 40),
                  fontFamily: t.mono,
                  fontSize: 14,
                  fontWeight: 600,
                  color: submitted
                    ? isCorrect
                      ? t.cyan
                      : t.rose
                    : t.violet,
                  background: submitted
                    ? isCorrect
                      ? `${t.cyan}10`
                      : `${t.rose}10`
                    : `${t.violet}08`,
                  border: `1.5px solid ${
                    submitted
                      ? isCorrect
                        ? t.cyan
                        : t.rose
                      : t.violet
                  }50`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  margin: '0 4px',
                  outline: 'none',
                  transition: reducedMotion ? 'none' : 'border-color 0.2s, background 0.2s',
                  verticalAlign: 'baseline',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={inputValue.trim().length === 0}
          style={{
            alignSelf: 'flex-start',
            background: inputValue.trim().length === 0 ? t.border : t.violet,
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontFamily: t.body,
            fontSize: 13,
            fontWeight: 600,
            color: inputValue.trim().length === 0 ? t.textMuted : t.bg,
            cursor: inputValue.trim().length === 0 ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (inputValue.trim().length > 0) {
              e.currentTarget.style.opacity = '0.85';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {tr('exercise.submit', 'Submit')}
        </button>
      )}

      {/* Accepted answer hint when incorrect */}
      {submitted && !isCorrect && (
        <div
          style={{
            fontFamily: t.body,
            fontSize: 12,
            color: t.textMuted,
          }}
        >
          <span style={{ color: t.textSecondary, fontWeight: 600 }}>
            {tr('exercise.fillBlank.accepted', 'Accepted answers: ')}
          </span>
          {exercise.acceptedAnswers.join(', ')}
        </div>
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
