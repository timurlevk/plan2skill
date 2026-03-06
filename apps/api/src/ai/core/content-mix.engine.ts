import type { ContentFormat, DomainCategory } from './domain-capability';
import { DOMAIN_FORMAT_AVAILABILITY } from './domain-capability';
import { getFormatWeights, type FormatWeights } from './content-format-matrix';

// ─── Proficiency-Based Ratios (§4.3) ───────────────────────────

type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface BucketRatio {
  theory: number;
  practice: number;
  assessment: number;
}

const PROFICIENCY_RATIOS: Record<Proficiency, BucketRatio> = {
  beginner:     { theory: 0.55, practice: 0.30, assessment: 0.15 },
  intermediate: { theory: 0.30, practice: 0.45, assessment: 0.25 },
  advanced:     { theory: 0.15, practice: 0.50, assessment: 0.35 },
  expert:       { theory: 0.10, practice: 0.50, assessment: 0.40 },
};

const FORMAT_BUCKET: Record<ContentFormat, keyof BucketRatio> = {
  article:        'theory',
  video_rec:      'theory',
  reflection:     'theory',
  code_challenge: 'practice',
  project:        'practice',
  hands_on:       'practice',
  quiz:           'assessment',
  boss:           'assessment',
};

// ─── Public Interface ───────────────────────────────────────────

export interface ContentMixRequest {
  bloomLevel: string;
  domainCategory: DomainCategory;
  proficiency: Proficiency;
  subscriptionTier: string;
  recentFormats: ContentFormat[];    // last 5 quest formats
  milestoneFormats: ContentFormat[]; // formats used in current milestone
  hasCodingComponent: boolean;
}

/**
 * Deterministic (weighted-random) content format selection.
 * Priority order from requirements §4.2:
 * 1. Domain filter
 * 2. Tier filter
 * 3. Anti-fatigue
 * 4. Anti-quiz-fatigue
 * 5. Ratio balancing
 * 6. Milestone diversity
 * 7. Weighted random pick
 */
export function selectContentFormat(request: ContentMixRequest): ContentFormat {
  const {
    bloomLevel,
    domainCategory,
    proficiency,
    subscriptionTier,
    recentFormats,
    milestoneFormats,
    hasCodingComponent,
  } = request;

  // Start with Bloom × Domain base weights
  const baseWeights = getFormatWeights(bloomLevel, domainCategory);
  const weights: FormatWeights = { ...baseWeights };

  // 1. Domain filter — remove formats invalid for this domain
  const validFormats = DOMAIN_FORMAT_AVAILABILITY[domainCategory];
  for (const fmt of Object.keys(weights) as ContentFormat[]) {
    if (!validFormats.includes(fmt)) {
      delete weights[fmt];
    }
  }

  // Also remove code_challenge if no coding component
  if (!hasCodingComponent) {
    delete weights.code_challenge;
  }

  // 2. Tier filter — code_challenge requires Pro+
  const tier = subscriptionTier.toLowerCase();
  if (tier === 'free') {
    delete weights.code_challenge;
  }

  // 3. Anti-fatigue — if last 2 quests were same format, remove it
  if (recentFormats.length >= 2) {
    const last = recentFormats[recentFormats.length - 1];
    const secondLast = recentFormats[recentFormats.length - 2];
    if (last && secondLast && last === secondLast) {
      // Only remove if there are other options left
      const remaining = Object.keys(weights).filter((f) => f !== last);
      if (remaining.length > 0) {
        delete weights[last];
      }
    }
  }

  // 4. Anti-quiz-fatigue — if last 2 were quiz/boss (assessment), force non-assessment
  if (recentFormats.length >= 2) {
    const last = recentFormats[recentFormats.length - 1];
    const secondLast = recentFormats[recentFormats.length - 2];
    const assessmentFormats: ContentFormat[] = ['quiz', 'boss'];
    if (
      last && secondLast &&
      assessmentFormats.includes(last) &&
      assessmentFormats.includes(secondLast)
    ) {
      const remaining = Object.keys(weights).filter(
        (f) => !assessmentFormats.includes(f as ContentFormat),
      );
      if (remaining.length > 0) {
        delete weights.quiz;
        delete weights.boss;
      }
    }
  }

  // 5. Ratio balancing — adjust weights based on proficiency bucket ratios
  const targetRatio = PROFICIENCY_RATIOS[proficiency];
  if (recentFormats.length >= 3) {
    const bucketCounts: BucketRatio = { theory: 0, practice: 0, assessment: 0 };
    for (const fmt of recentFormats) {
      const bucket = FORMAT_BUCKET[fmt];
      if (bucket) {
        bucketCounts[bucket]++;
      }
    }
    const total = recentFormats.length;
    const actualRatio: BucketRatio = {
      theory: bucketCounts.theory / total,
      practice: bucketCounts.practice / total,
      assessment: bucketCounts.assessment / total,
    };

    // Boost formats from under-represented buckets
    for (const [fmt, weight] of Object.entries(weights) as [ContentFormat, number][]) {
      const bucket = FORMAT_BUCKET[fmt];
      if (!bucket) continue;
      const deficit = targetRatio[bucket] - actualRatio[bucket];
      if (deficit > 0.1) {
        weights[fmt] = weight * (1 + deficit * 2);
      } else if (deficit < -0.1) {
        weights[fmt] = weight * Math.max(0.2, 1 + deficit);
      }
    }
  }

  // 6. Milestone diversity — boost unused formats if <3 unique in milestone
  const uniqueMilestoneFormats = new Set(milestoneFormats);
  if (uniqueMilestoneFormats.size < 3 && milestoneFormats.length >= 2) {
    for (const fmt of Object.keys(weights) as ContentFormat[]) {
      if (!uniqueMilestoneFormats.has(fmt)) {
        const currentWeight = weights[fmt];
        if (currentWeight !== undefined) {
          weights[fmt] = currentWeight * 1.5;
        }
      }
    }
  }

  // 7. Weighted random pick
  return weightedRandomPick(weights);
}

/** Pick a format based on weights using weighted random selection */
function weightedRandomPick(weights: FormatWeights): ContentFormat {
  const entries = Object.entries(weights).filter(
    ([, w]) => w !== undefined && w > 0,
  ) as [ContentFormat, number][];

  if (entries.length === 0) {
    return 'article'; // absolute fallback
  }

  if (entries.length === 1) {
    return entries[0]![0];
  }

  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [fmt, weight] of entries) {
    random -= weight;
    if (random <= 0) {
      return fmt;
    }
  }

  // Fallback to last entry (floating point edge case)
  return entries[entries.length - 1]![0];
}
