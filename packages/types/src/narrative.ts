// ═══════════════════════════════════════════
// NARRATIVE & LORE SYSTEM — Shared types (Phase P)
// ═══════════════════════════════════════════

export type NarrativeMode = 'full' | 'minimal' | 'off';
export type EpisodeCategory = 'standard' | 'climax' | 'lore_drop' | 'character_focus' | 'season_finale';
export type EpisodeStatus = 'draft' | 'reviewed' | 'scheduled' | 'published' | 'archived';
export type EpisodeSource = 'home' | 'archive' | 'notification';

export interface EpisodeCardData {
  id: string;
  episodeNumber: number;
  globalNumber: number;
  title: string;
  contextSentence: string;
  body: string;
  cliffhanger: string;
  sageReflection: string;
  illustrationUrl: string | null;
  category: EpisodeCategory;
  readTimeSeconds: number;
  seasonTitle: string;
  seasonNumber: number;
  isRead: boolean;
  isDismissed: boolean;
}

export interface SeasonSummary {
  id: string;
  seasonNumber: number;
  title: string;
  description: string;
  status: string;
  episodeCount: number;
}

export interface SeasonStateTracker {
  currentAct: 1 | 2 | 3;
  currentEpisode: number;
  activeThreads: {
    threadId: string;
    title: string;
    status: 'active' | 'resolved' | 'paused';
    openedAtEpisode: number;
    resolvedAtEpisode?: number;
  }[];
  characterStates: {
    characterId: string;
    name: string;
    currentLocation: string;
    currentMood: string;
    lastAppearance: number;
    knownFacts: string[];
  }[];
  establishedFacts: string[];
  recentSummaries: { episodeNumber: number; summary: string }[];
  constraints: string[];
}

export interface NarrativePreferenceData {
  narrativeMode: NarrativeMode;
  lastReadEpisode: number | null;
  onboardingLegendCompleted: boolean;
}

export interface EpisodeReviewItem {
  id: string;
  episodeNumber: number;
  globalNumber: number;
  title: string;
  body: string;
  sageReflection: string;
  category: EpisodeCategory;
  wordCount: number;
  status: EpisodeStatus;
  aiModelUsed: string | null;
  aiConfidence: number | null;
  createdAt: string;
}
