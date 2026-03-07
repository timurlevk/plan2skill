'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { t } from '../../../../(onboarding)/_components/tokens';
import { NeonIcon } from '../../../../(onboarding)/_components/NeonIcon';
import { useI18nStore } from '@plan2skill/store';
import type { Exercise, MCQExercise } from '@plan2skill/types';
import { ExerciseRenderer } from './exercises/ExerciseRenderer';

// ===================================================
// TRIAL BY FIRE SCREEN -- Exercises one at a time.
// Uses ExerciseRenderer for all exercise types.
// Falls back to quizQuestions if no exercises provided.
// ===================================================

interface QuizQuestionItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bloomLevel?: string;
}

interface TrialByFireScreenProps {
  exercises: Exercise[] | null;
  quizQuestions: QuizQuestionItem[] | null;
  onComplete: (score: number, total: number) => void;
  energyCrystals: number;
  onConsumeCrystal?: () => void;
  taskId: string;
}

/** Normalize quizQuestions into Exercise-compatible MCQ items */
function quizToExercises(questions: QuizQuestionItem[]): MCQExercise[] {
  return questions.map((q, i) => ({
    id: `quiz-${i}`,
    type: 'mcq' as const,
    difficulty: 'medium' as const,
    bloomLevel: q.bloomLevel ?? 'remember',
    points: 1,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
}

export function TrialByFireScreen({
  exercises,
  quizQuestions,
  onComplete,
  energyCrystals,
  onConsumeCrystal,
  taskId,
}: TrialByFireScreenProps) {
  const tr = useI18nStore((s) => s.t);

  // Normalize all items into Exercise[]
  const allExercises: Exercise[] = useMemo(() => {
    if (exercises && exercises.length > 0) return exercises;
    if (quizQuestions && quizQuestions.length > 0) return quizToExercises(quizQuestions);
    return [];
  }, [exercises, quizQuestions]);

  const total = allExercises.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const currentExercise = currentIndex < total ? allExercises[currentIndex] : undefined;

  const handleAnswer = useCallback(
    (correct: boolean) => {
      const newCorrect = correctCount + (correct ? 1 : 0);
      const newAnswered = answeredCount + 1;
      setCorrectCount(newCorrect);
      setAnsweredCount(newAnswered);

      if (newAnswered >= total) {
        // All exercises done
        setTimeout(() => onComplete(newCorrect, total), 300);
      } else {
        setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
      }
    },
    [correctCount, answeredCount, total, onComplete],
  );

  // Empty state
  if (total === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '40px 20px',
        animation: 'fadeUp 0.4s ease-out',
      }}>
        <NeonIcon type="quiz" size={40} color="muted" />
        <p style={{
          fontFamily: t.body,
          fontSize: 14,
          color: t.textMuted,
          textAlign: 'center' as const,
        }}>
          {tr('quest.trial.no_exercises', 'No exercises available for this quest.')}
        </p>
        <button
          onClick={() => onComplete(0, 0)}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            background: t.gradient,
            color: '#FFFFFF',
            fontFamily: t.display,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {tr('quest.trial.skip', 'Continue')}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      animation: 'fadeUp 0.4s ease-out',
    }}>
      {/* Header: progress + crystal indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottom: `1px solid ${t.border}`,
      }}>
        {/* Exercise counter */}
        <span style={{
          fontFamily: t.mono,
          fontSize: 12,
          fontWeight: 600,
          color: t.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <NeonIcon type="swords" size={14} color="rose" />
          {tr('quest.trial.exercise_of', 'Exercise {current} of {total}')
            .replace('{current}', String(currentIndex + 1))
            .replace('{total}', String(total))}
        </span>

        {/* Score so far */}
        <span style={{
          fontFamily: t.mono,
          fontSize: 12,
          fontWeight: 600,
          color: correctCount > 0 ? t.mint : t.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <NeonIcon type="check" size={12} color={correctCount > 0 ? 'mint' : 'muted'} />
          {correctCount}/{answeredCount}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: 4,
        borderRadius: 2,
        background: t.border,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${total > 0 ? Math.round((answeredCount / total) * 100) : 0}%`,
          height: '100%',
          borderRadius: 2,
          background: t.gradient,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Energy crystals display */}
      {energyCrystals > 0 && onConsumeCrystal && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          background: `${t.cyan}08`,
          border: `1px solid ${t.cyan}20`,
        }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: Math.min(energyCrystals, 5) }, (_, i) => (
              <NeonIcon key={i} type="crystalFull" size={14} color="cyan" />
            ))}
          </div>
          <span style={{
            fontFamily: t.mono,
            fontSize: 11,
            color: t.cyan,
          }}>
            {energyCrystals} {tr('quest.trial.crystals', 'crystals')}
          </span>
        </div>
      )}

      {/* Current exercise */}
      {currentExercise && (
        <div key={`exercise-${currentIndex}`} style={{ animation: 'fadeUp 0.3s ease-out' }}>
          <ExerciseRenderer
            exercise={currentExercise}
            exerciseNumber={currentIndex + 1}
            totalExercises={total}
            onComplete={handleAnswer}
            energyCrystals={energyCrystals}
            onConsumeCrystal={onConsumeCrystal}
            taskId={taskId}
          />
        </div>
      )}

      {/* Difficulty indicator */}
      {currentExercise && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: t.mono,
            fontSize: 10,
            fontWeight: 600,
            color: t.textMuted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
          }}>
            {tr('quest.trial.difficulty', 'Difficulty')}:
          </span>
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <div
              key={level}
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background:
                  currentExercise.difficulty === 'hard'
                    ? t.rose
                    : currentExercise.difficulty === 'medium' && level !== 'hard'
                      ? t.gold
                      : currentExercise.difficulty === 'easy' && level === 'easy'
                        ? t.mint
                        : `${t.textMuted}30`,
                transition: 'background 0.2s ease',
              }}
            />
          ))}
          <span style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.textMuted,
          }}>
            {currentExercise.difficulty}
          </span>
        </div>
      )}
    </div>
  );
}
