'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { CodeCompletionExercise as CodeCompletionExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// CODE COMPLETION EXERCISE — Code editor with starter code
// Mono font, language badge, test cases, basic string comparison
// Progressive hints from exercise.hints[]
// ═══════════════════════════════════════════

interface CodeCompletionExerciseProps {
  exercise: CodeCompletionExerciseType;
  onAnswer: (correct: boolean) => void;
}

/** Normalize code for comparison: trim, collapse whitespace runs to single space */
function normalizeCode(code: string): string {
  return code.trim().replace(/\s+/g, ' ');
}

export function CodeCompletionExercise({ exercise, onAnswer }: CodeCompletionExerciseProps) {
  const tr = useI18nStore((s) => s.t);
  const [code, setCode] = useState(exercise.starterCode);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);

  // prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const currentHint = useMemo(() => {
    if (hintIndex < 0) return null;
    return exercise.hints[hintIndex] ?? null;
  }, [hintIndex, exercise.hints]);

  const showNextHint = useCallback(() => {
    setHintIndex((prev) => {
      if (prev < exercise.hints.length - 1) return prev + 1;
      return prev;
    });
  }, [exercise.hints.length]);

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    signalAttempt();

    const correct = normalizeCode(code) === normalizeCode(exercise.solution);
    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);
  }, [submitted, code, exercise.solution]);

  const handleContinue = useCallback(() => {
    onAnswer(isCorrect);
  }, [isCorrect, onAnswer]);

  // Handle tab key in textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setCode(newValue);
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      });
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Language badge */}
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
      </div>

      {/* Starter code display */}
      <div>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            fontWeight: 600,
            color: t.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {tr('exercise.code.starter', 'Starter Code')}
        </span>
        <pre
          style={{
            fontFamily: t.mono,
            fontSize: 13,
            color: t.mint,
            background: t.bgElevated,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 14,
            margin: 0,
            overflowX: 'auto',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {exercise.starterCode}
        </pre>
      </div>

      {/* Code input */}
      <div>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            fontWeight: 600,
            color: t.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {tr('exercise.code.solution', 'Your Solution')}
        </span>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitted}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 120,
            fontFamily: t.mono,
            fontSize: 13,
            color: submitted ? (isCorrect ? t.cyan : t.rose) : t.text,
            background: submitted
              ? isCorrect
                ? `${t.cyan}06`
                : `${t.rose}06`
              : t.bgElevated,
            border: `1.5px solid ${
              submitted ? (isCorrect ? t.cyan : t.rose) : t.border
            }`,
            borderRadius: 8,
            padding: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            transition: reducedMotion ? 'none' : 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Test cases */}
      {exercise.testCases.length > 0 && (
        <div>
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              fontWeight: 600,
              color: t.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {tr('exercise.code.testCases', 'Test Cases')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {exercise.testCases.map((testCase, index) => (
              <div
                key={index}
                style={{
                  fontFamily: t.mono,
                  fontSize: 12,
                  color: t.textSecondary,
                  background: `${t.border}20`,
                  borderRadius: 6,
                  padding: '6px 10px',
                  lineHeight: 1.5,
                }}
              >
                {testCase}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progressive hints */}
      {!submitted && exercise.hints.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={showNextHint}
            disabled={hintIndex >= exercise.hints.length - 1}
            style={{
              background: 'transparent',
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: '4px 10px',
              fontFamily: t.body,
              fontSize: 11,
              color: hintIndex >= exercise.hints.length - 1 ? t.textMuted : t.gold,
              cursor: hintIndex >= exercise.hints.length - 1 ? 'default' : 'pointer',
            }}
          >
            {tr('exercise.code.hint', 'Show Hint')} ({hintIndex + 1}/{exercise.hints.length})
          </button>
          {currentHint && (
            <span
              style={{
                fontFamily: t.body,
                fontSize: 12,
                color: t.gold,
                animation: reducedMotion ? 'none' : 'fadeUp 0.2s ease-out',
              }}
            >
              {currentHint}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={code.trim().length === 0}
            style={{
              background: code.trim().length === 0 ? t.border : t.violet,
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontFamily: t.body,
              fontSize: 13,
              fontWeight: 600,
              color: code.trim().length === 0 ? t.textMuted : t.bg,
              cursor: code.trim().length === 0 ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              if (code.trim().length > 0) e.currentTarget.style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {tr('exercise.code.run', 'Submit Code')}
          </button>
        )}
      </div>

      {/* Show correct solution on incorrect */}
      {submitted && !isCorrect && (
        <div>
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              fontWeight: 600,
              color: t.cyan,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {tr('exercise.code.correctSolution', 'Correct Solution')}
          </span>
          <pre
            style={{
              fontFamily: t.mono,
              fontSize: 13,
              color: t.cyan,
              background: `${t.cyan}06`,
              border: `1px solid ${t.cyan}30`,
              borderRadius: 8,
              padding: 14,
              margin: 0,
              overflowX: 'auto',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {exercise.solution}
          </pre>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <FeedbackPanel
          correct={isCorrect}
          explanation={
            exercise.hints.length > 0
              ? exercise.hints[exercise.hints.length - 1] ?? ''
              : tr('exercise.code.reviewSolution', 'Review the correct solution above.')
          }
          onContinue={handleContinue}
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
