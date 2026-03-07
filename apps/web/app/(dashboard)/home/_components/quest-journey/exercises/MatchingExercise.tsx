'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { t } from '../../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import { signalAttempt } from './HintDrawer';
import { FeedbackPanel } from './FeedbackPanel';
import type { MatchingExercise as MatchingExerciseType } from '@plan2skill/types';

// ═══════════════════════════════════════════
// MATCHING EXERCISE — Click-to-match pairs
// Left column (labels) → Right column (shuffled definitions)
// Click left, then click right to create a pair
// ═══════════════════════════════════════════

interface MatchingExerciseProps {
  exercise: MatchingExerciseType;
  onAnswer: (correct: boolean) => void;
}

// Stable color palette for matched pairs
const PAIR_COLORS = [t.cyan, t.violet, t.gold, t.mint, t.rose, t.indigo, t.fuchsia] as const;

function shuffleArray<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  // Simple deterministic shuffle using seed
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    const tmp = result[i];
    const jItem = result[j];
    if (tmp !== undefined && jItem !== undefined) {
      result[i] = jItem;
      result[j] = tmp;
    }
  }
  return result;
}

export function MatchingExercise({ exercise, onAnswer }: MatchingExerciseProps) {
  const tr = useI18nStore((s) => s.t);

  // Shuffle right column once on mount
  const shuffledRight = useMemo(() => {
    const rights = exercise.pairs.map((p) => p.right);
    // Use pairs length as a simple seed
    return shuffleArray(rights, exercise.pairs.length * 7 + 42);
  }, [exercise.pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  // Map: left index → right index (shuffled)
  const [matches, setMatches] = useState<Map<number, number>>(new Map());
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

  // Set of already-matched right indices
  const matchedRightIndices = useMemo(() => {
    return new Set(matches.values());
  }, [matches]);

  const handleLeftClick = useCallback(
    (index: number) => {
      if (submitted) return;
      // If this left is already matched, unselect it (remove match)
      if (matches.has(index)) {
        setMatches((prev) => {
          const next = new Map(prev);
          next.delete(index);
          return next;
        });
        setSelectedLeft(null);
        return;
      }
      setSelectedLeft(index);
    },
    [submitted, matches],
  );

  const handleRightClick = useCallback(
    (rightIndex: number) => {
      if (submitted || selectedLeft === null) return;
      // If right is already matched, ignore
      if (matchedRightIndices.has(rightIndex)) return;

      setMatches((prev) => {
        const next = new Map(prev);
        next.set(selectedLeft, rightIndex);
        return next;
      });
      setSelectedLeft(null);
    },
    [submitted, selectedLeft, matchedRightIndices],
  );

  const allMatched = matches.size === exercise.pairs.length;

  const handleSubmit = useCallback(() => {
    if (!allMatched || submitted) return;
    signalAttempt();

    // Check correctness: for each left index, the matched shuffled-right item
    // should equal the original pair's right value
    let allCorrect = true;
    for (let i = 0; i < exercise.pairs.length; i++) {
      const pair = exercise.pairs[i];
      const matchedRightIdx = matches.get(i);
      if (matchedRightIdx === undefined || pair === undefined) {
        allCorrect = false;
        break;
      }
      const matchedRightText = shuffledRight[matchedRightIdx];
      if (matchedRightText !== pair.right) {
        allCorrect = false;
        break;
      }
    }

    setIsCorrect(allCorrect);
    setSubmitted(true);
    setShowFeedback(true);
  }, [allMatched, submitted, exercise.pairs, matches, shuffledRight]);

  const handleContinue = useCallback(() => {
    onAnswer(isCorrect);
  }, [isCorrect, onAnswer]);

  // Get color for a matched pair
  const getPairColor = (leftIndex: number): string | null => {
    if (!matches.has(leftIndex)) return null;
    return PAIR_COLORS[leftIndex % PAIR_COLORS.length] ?? t.violet;
  };

  // Check if a specific match is correct (for post-submit highlighting)
  const isMatchCorrect = (leftIndex: number): boolean | null => {
    if (!submitted) return null;
    const matchedRightIdx = matches.get(leftIndex);
    const pair = exercise.pairs[leftIndex];
    if (matchedRightIdx === undefined || pair === undefined) return false;
    const matchedRightText = shuffledRight[matchedRightIdx];
    return matchedRightText === pair.right;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Instructions */}
      <p
        style={{
          fontFamily: t.body,
          fontSize: 13,
          color: t.textSecondary,
          margin: 0,
        }}
      >
        {tr('exercise.matching.instructions', 'Click an item on the left, then click its match on the right.')}
      </p>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Left column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {exercise.pairs.map((pair, index) => {
            const pairColor = getPairColor(index);
            const matchResult = isMatchCorrect(index);
            const isActive = selectedLeft === index;

            let borderColor: string = t.border;
            let bgColor: string = t.bgElevated;
            let textColor: string = t.text;

            if (submitted && matchResult !== null) {
              borderColor = matchResult ? t.cyan : t.rose;
              bgColor = matchResult ? `${t.cyan}08` : `${t.rose}08`;
            } else if (pairColor) {
              borderColor = pairColor;
              bgColor = `${pairColor}10`;
              textColor = pairColor;
            } else if (isActive) {
              borderColor = t.violet;
              bgColor = `${t.violet}08`;
            }

            return (
              <button
                key={`left-${index}`}
                onClick={() => handleLeftClick(index)}
                disabled={submitted}
                style={{
                  padding: '10px 12px',
                  background: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 8,
                  fontFamily: t.body,
                  fontSize: 13,
                  color: textColor,
                  cursor: submitted ? 'default' : 'pointer',
                  textAlign: 'left' as const,
                  transition: reducedMotion ? 'none' : 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {submitted && matchResult !== null && (
                  <NeonIcon
                    type={matchResult ? 'check' : 'close'}
                    size={14}
                    color={matchResult ? 'cyan' : 'rose'}
                  />
                )}
                <span style={{ flex: 1 }}>{pair.left}</span>
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {shuffledRight.map((rightText, rightIndex) => {
            const isMatched = matchedRightIndices.has(rightIndex);
            // Find which left index is matched to this right
            let matchedLeftIndex: number | null = null;
            for (const [leftIdx, rIdx] of matches.entries()) {
              if (rIdx === rightIndex) {
                matchedLeftIndex = leftIdx;
                break;
              }
            }

            const pairColor = matchedLeftIndex !== null ? getPairColor(matchedLeftIndex) : null;
            const matchResult =
              matchedLeftIndex !== null ? isMatchCorrect(matchedLeftIndex) : null;

            let borderColor: string = t.border;
            let bgColor: string = t.bgElevated;
            let textColor: string = t.text;

            if (submitted && matchResult !== null) {
              borderColor = matchResult ? t.cyan : t.rose;
              bgColor = matchResult ? `${t.cyan}08` : `${t.rose}08`;
            } else if (pairColor) {
              borderColor = pairColor;
              bgColor = `${pairColor}10`;
              textColor = pairColor;
            }

            return (
              <button
                key={`right-${rightIndex}`}
                onClick={() => handleRightClick(rightIndex)}
                disabled={submitted || isMatched || selectedLeft === null}
                style={{
                  padding: '10px 12px',
                  background: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 8,
                  fontFamily: t.body,
                  fontSize: 13,
                  color: textColor,
                  cursor:
                    submitted || isMatched || selectedLeft === null
                      ? 'default'
                      : 'pointer',
                  textAlign: 'left' as const,
                  transition: reducedMotion ? 'none' : 'all 0.15s ease',
                  opacity: isMatched && !submitted ? 0.6 : 1,
                }}
              >
                {rightText}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allMatched}
          style={{
            alignSelf: 'flex-start',
            background: allMatched ? t.violet : t.border,
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontFamily: t.body,
            fontSize: 13,
            fontWeight: 600,
            color: allMatched ? t.bg : t.textMuted,
            cursor: allMatched ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (allMatched) e.currentTarget.style.opacity = '0.85';
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
