'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { FreeTextExercise as FreeTextExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// FREE TEXT EXERCISE — Open-ended prompt with keyword scoring
// Minimum 10 chars to submit, 50%+ keyword match = correct
// Shows rubric in feedback
// ═══════════════════════════════════════════

interface FreeTextExerciseProps {
  exercise: FreeTextExerciseType;
  onAnswer: (correct: boolean) => void;
}

export function FreeTextExercise({ exercise, onAnswer }: FreeTextExerciseProps) {
  const tr = useI18nStore((s) => s.t);
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
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

  const charCount = response.length;
  const canSubmit = charCount >= 10;

  const handleSubmit = useCallback(() => {
    if (submitted || !canSubmit) return;
    signalAttempt();

    const lowerResponse = response.toLowerCase();
    const matched = exercise.keywords.filter((keyword) =>
      lowerResponse.includes(keyword.toLowerCase()),
    );
    setMatchedKeywords(matched);

    const threshold = Math.ceil(exercise.keywords.length * 0.5);
    const correct = matched.length >= threshold;
    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);
  }, [submitted, canSubmit, response, exercise.keywords]);

  const handleContinue = useCallback(() => {
    onAnswer(isCorrect);
  }, [isCorrect, onAnswer]);

  // Determine if partial (some keywords but not enough)
  const isPartial = useMemo(() => {
    if (!submitted) return false;
    const threshold = Math.ceil(exercise.keywords.length * 0.5);
    return matchedKeywords.length > 0 && matchedKeywords.length < threshold;
  }, [submitted, matchedKeywords.length, exercise.keywords.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Prompt */}
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
        {exercise.prompt}
      </p>

      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          disabled={submitted}
          rows={4}
          placeholder={tr('exercise.freeText.placeholder', 'Write your answer here...')}
          style={{
            width: '100%',
            fontFamily: t.body,
            fontSize: 14,
            color: t.text,
            background: t.bgElevated,
            border: `1.5px solid ${
              submitted ? (isCorrect ? t.cyan : isPartial ? t.gold : t.rose) : t.border
            }`,
            borderRadius: 10,
            padding: '12px 14px',
            paddingBottom: 28,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            minHeight: 80,
            transition: reducedMotion ? 'none' : 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
        />
        {/* Char counter */}
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            fontFamily: t.mono,
            fontSize: 10,
            color: canSubmit ? t.textMuted : t.rose,
          }}
        >
          {charCount} {tr('exercise.freeText.chars', 'chars')}
          {!canSubmit && ` (${tr('exercise.freeText.min', 'min 10')})`}
        </span>
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            alignSelf: 'flex-start',
            background: canSubmit ? t.violet : t.border,
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontFamily: t.body,
            fontSize: 13,
            fontWeight: 600,
            color: canSubmit ? t.bg : t.textMuted,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (canSubmit) e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {tr('exercise.submit', 'Submit')}
        </button>
      )}

      {/* Keyword results */}
      {submitted && (
        <div
          style={{
            background: t.bgElevated,
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            padding: 12,
            animation: reducedMotion ? 'none' : 'fadeUp 0.25s ease-out',
          }}
        >
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              fontWeight: 600,
              color: t.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 8,
            }}
          >
            {tr('exercise.freeText.keywords', 'Keywords')} ({matchedKeywords.length}/{exercise.keywords.length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {exercise.keywords.map((keyword) => {
              const isMatched = matchedKeywords.includes(keyword);
              return (
                <span
                  key={keyword}
                  style={{
                    fontFamily: t.mono,
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: isMatched ? `${t.cyan}14` : `${t.rose}10`,
                    color: isMatched ? t.cyan : t.textMuted,
                    border: `1px solid ${isMatched ? `${t.cyan}30` : `${t.border}`}`,
                    textDecoration: isMatched ? 'none' : 'line-through',
                  }}
                >
                  {keyword}
                </span>
              );
            })}
          </div>

          {/* Rubric */}
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 10,
                fontWeight: 600,
                color: t.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {tr('exercise.freeText.rubric', 'Rubric')}
            </span>
            <p
              style={{
                fontFamily: t.body,
                fontSize: 12,
                color: t.textSecondary,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {exercise.rubric}
            </p>
          </div>

          {/* Sample answer */}
          <div style={{ marginTop: 10 }}>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 10,
                fontWeight: 600,
                color: t.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {tr('exercise.freeText.sample', 'Sample Answer')}
            </span>
            <p
              style={{
                fontFamily: t.body,
                fontSize: 12,
                color: t.textSecondary,
                lineHeight: 1.5,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {exercise.sampleAnswer}
            </p>
          </div>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <FeedbackPanel
          correct={isCorrect}
          explanation={exercise.rubric}
          onContinue={handleContinue}
          partial={isPartial}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
