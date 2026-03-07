import type { ExerciseType, ExerciseDifficulty } from '@plan2skill/types';

// ─── Exercise Type Selection ───────────────────────────────────

export interface ExerciseTypeSelection {
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
}

/**
 * Bloom level buckets determine which exercise types are pedagogically appropriate.
 * Lower-order thinking → recognition & recall exercises.
 * Higher-order thinking → production & synthesis exercises.
 */
const BLOOM_EXERCISE_MAP: Record<string, ExerciseType[]> = {
  // Lower-order: remember / understand
  lower: ['true_false', 'mcq', 'fill_blank'],
  // Mid-order: apply / analyze
  mid: ['mcq', 'matching', 'fill_blank'],
  // Higher-order: evaluate / create
  higher: ['code_completion', 'free_text', 'parsons'],
};

/** Coding-domain replacements for non-coding domains. */
const NON_CODING_REPLACEMENTS: Record<ExerciseType, ExerciseType> = {
  code_completion: 'drag_drop',
  parsons: 'matching',
  // Identity mappings — no replacement needed
  mcq: 'mcq',
  true_false: 'true_false',
  fill_blank: 'fill_blank',
  matching: 'matching',
  drag_drop: 'drag_drop',
  free_text: 'free_text',
};

/** Progressive difficulty: exercise 1 = easy, 2 = medium, 3 = hard */
const DIFFICULTY_PROGRESSION: ExerciseDifficulty[] = ['easy', 'medium', 'hard'];

/**
 * Classify a Bloom level into a bucket for exercise selection.
 */
function classifyBloom(bloomLevel: string): 'lower' | 'mid' | 'higher' {
  switch (bloomLevel) {
    case 'remember':
    case 'understand':
      return 'lower';
    case 'apply':
    case 'analyze':
      return 'mid';
    case 'evaluate':
    case 'create':
      return 'higher';
    default:
      return 'lower';
  }
}

/**
 * Select 3 exercise types based on Bloom level, domain, and coding context.
 *
 * Rules:
 * 1. Bloom level determines the candidate exercise types.
 * 2. Non-coding domains replace code_completion with drag_drop & parsons with matching.
 * 3. Difficulty progresses: easy → medium → hard.
 * 4. Each exercise type is unique in the selection (no duplicates).
 */
export function selectExerciseTypes(
  bloomLevel: string,
  hasCodingComponent: boolean,
): ExerciseTypeSelection[] {
  const bucket = classifyBloom(bloomLevel);
  const candidates = BLOOM_EXERCISE_MAP[bucket];

  if (!candidates) {
    // Fallback to lower-order if bucket is unknown
    return selectExerciseTypes('remember', hasCodingComponent);
  }

  // Apply domain-specific replacements for non-coding domains
  const adjusted = hasCodingComponent
    ? candidates
    : candidates.map((type) => NON_CODING_REPLACEMENTS[type] ?? type);

  // Deduplicate while preserving order
  const unique: ExerciseType[] = [];
  const seen = new Set<ExerciseType>();
  for (const type of adjusted) {
    if (!seen.has(type)) {
      seen.add(type);
      unique.push(type);
    }
  }

  // Take up to 3 types, pad with MCQ if needed
  while (unique.length < 3) {
    if (!seen.has('mcq')) {
      seen.add('mcq');
      unique.push('mcq');
    } else if (!seen.has('true_false')) {
      seen.add('true_false');
      unique.push('true_false');
    } else if (!seen.has('fill_blank')) {
      seen.add('fill_blank');
      unique.push('fill_blank');
    } else {
      // Should never happen, but break to avoid infinite loop
      break;
    }
  }

  const selected = unique.slice(0, 3);

  // Assign progressive difficulty
  return selected.map((type, idx): ExerciseTypeSelection => {
    const difficulty = DIFFICULTY_PROGRESSION[idx] ?? 'easy';
    return { type, difficulty };
  });
}
