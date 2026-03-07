'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useI18nStore } from '@plan2skill/store';
import { ExerciseShell } from './ExerciseShell';
import { HintDrawer } from './HintDrawer';
import { MCQExercise } from './MCQExercise';
import { TrueFalseExercise } from './TrueFalseExercise';
import { FillBlankExercise } from './FillBlankExercise';
import { MatchingExercise } from './MatchingExercise';
import { DragDropExercise } from './DragDropExercise';
import { CodeCompletionExercise } from './CodeCompletionExercise';
import { FreeTextExercise } from './FreeTextExercise';
import { ParsonsExercise } from './ParsonsExercise';
import type { Exercise } from '@plan2skill/types';

// ═══════════════════════════════════════════
// EXERCISE RENDERER — Orchestrator component
// Switches on exercise.type, wraps in ExerciseShell,
// manages skip timer and hint drawer
// ═══════════════════════════════════════════

interface ExerciseRendererProps {
  exercise: Exercise;
  exerciseNumber: number;
  totalExercises: number;
  onComplete: (correct: boolean) => void;
  energyCrystals: number;
  onConsumeCrystal?: () => void;
  taskId: string;
}

const SKIP_TIMER_MS = 10_000;

/** Extract answer text for the hint drawer's "Reveal Answer" tier */
function getAnswerText(exercise: Exercise): string {
  switch (exercise.type) {
    case 'mcq': {
      const option = exercise.options[exercise.correctIndex];
      return option ?? '';
    }
    case 'true_false':
      return exercise.correctAnswer ? 'True' : 'False';
    case 'fill_blank':
      return exercise.acceptedAnswers.join(' / ');
    case 'matching':
      return exercise.pairs.map((p) => `${p.left} → ${p.right}`).join('\n');
    case 'drag_drop':
      return exercise.correctOrder.join('\n');
    case 'code_completion':
      return exercise.solution;
    case 'free_text':
      return exercise.sampleAnswer;
    case 'parsons':
      return exercise.correctOrder.join('\n');
    default:
      return '';
  }
}

/** Extract hints array for exercises that have hints */
function getHints(exercise: Exercise): string[] {
  switch (exercise.type) {
    case 'code_completion':
      return exercise.hints;
    default:
      return [];
  }
}

export function ExerciseRenderer({
  exercise,
  exerciseNumber,
  totalExercises,
  onComplete,
  energyCrystals,
  onConsumeCrystal,
  taskId,
}: ExerciseRendererProps) {
  const tr = useI18nStore((s) => s.t);
  const [showSkip, setShowSkip] = useState(false);
  const [answered, setAnswered] = useState(false);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityRef = useRef<number>(Date.now());

  // Reset state on exercise change
  useEffect(() => {
    setShowSkip(false);
    setAnswered(false);
    activityRef.current = Date.now();
  }, [exercise.id]);

  // Skip timer: show skip button after SKIP_TIMER_MS of inactivity
  useEffect(() => {
    if (answered) return;

    const checkInactivity = () => {
      const elapsed = Date.now() - activityRef.current;
      if (elapsed >= SKIP_TIMER_MS) {
        setShowSkip(true);
      }
    };

    skipTimerRef.current = setTimeout(checkInactivity, SKIP_TIMER_MS);

    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, [answered, exercise.id]);

  // Track user activity to delay skip timer
  useEffect(() => {
    if (answered) return;

    const resetActivity = () => {
      activityRef.current = Date.now();
      setShowSkip(false);

      // Restart timer
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      skipTimerRef.current = setTimeout(() => {
        const elapsed = Date.now() - activityRef.current;
        if (elapsed >= SKIP_TIMER_MS) {
          setShowSkip(true);
        }
      }, SKIP_TIMER_MS);
    };

    window.addEventListener('click', resetActivity);
    window.addEventListener('keydown', resetActivity);

    return () => {
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('keydown', resetActivity);
    };
  }, [answered, exercise.id]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setAnswered(true);
      setShowSkip(false);
      onComplete(correct);
    },
    [onComplete],
  );

  const handleSkip = useCallback(() => {
    setAnswered(true);
    onComplete(false); // Skip counts as incorrect
  }, [onComplete]);

  const answerText = getAnswerText(exercise);
  const hints = getHints(exercise);

  const renderExercise = () => {
    switch (exercise.type) {
      case 'mcq':
        return <MCQExercise exercise={exercise} onAnswer={handleAnswer} />;
      case 'true_false':
        return <TrueFalseExercise exercise={exercise} onAnswer={handleAnswer} />;
      case 'fill_blank':
        return <FillBlankExercise exercise={exercise} onAnswer={handleAnswer} />;
      case 'matching':
        return <MatchingExercise exercise={exercise} onAnswer={handleAnswer} />;
      case 'drag_drop':
        return <DragDropExercise exercise={exercise} onAnswer={handleAnswer} />;
      case 'code_completion':
        return <CodeCompletionExercise exercise={exercise} onAnswer={handleAnswer} />;
      case 'free_text':
        return <FreeTextExercise exercise={exercise} onAnswer={handleAnswer} />;
      case 'parsons':
        return <ParsonsExercise exercise={exercise} onAnswer={handleAnswer} />;
      default: {
        // Exhaustive check
        const _never: never = exercise;
        return (
          <p style={{ color: '#FF6B8A' }}>
            {tr('exercise.unsupported', 'Unsupported exercise type')}
          </p>
        );
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ExerciseShell
        exerciseNumber={exerciseNumber}
        totalExercises={totalExercises}
        difficulty={exercise.difficulty}
        points={exercise.points}
        onSkip={handleSkip}
        showSkip={showSkip && !answered}
      >
        {renderExercise()}
      </ExerciseShell>

      {/* Hint drawer — shown below the exercise shell */}
      {!answered && (
        <HintDrawer
          hints={hints}
          energyCrystals={energyCrystals}
          onConsumeCrystal={onConsumeCrystal}
          answer={answerText}
          taskId={taskId}
        />
      )}
    </div>
  );
}
