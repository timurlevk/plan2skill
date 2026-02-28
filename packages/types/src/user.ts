import type { AuthProvider, SubscriptionTier } from './enums';

export interface User {
  id: string;
  displayName: string;
  authProvider: AuthProvider;
  providerSubId: string; // Zero-PII: only provider's anonymous sub ID
  subscriptionTier: SubscriptionTier;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  subscriptionTier: SubscriptionTier;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  roadmapCount: number;
  tasksCompleted: number;
}

export interface UpdateProfileInput {
  displayName?: string;
}
