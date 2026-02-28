import type { MilestoneStatus, Rarity, RoadmapStatus, TaskStatus, TaskType } from './enums';

// ─── Roadmap ─────────────────────────────────────────────────────

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  goal: string;
  description: string;
  durationDays: number;
  dailyMinutes: number;
  status: RoadmapStatus;
  progress: number; // 0-100
  aiModel: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

// ─── Milestone ───────────────────────────────────────────────────

export interface Milestone {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  weekStart: number;
  weekEnd: number;
  order: number;
  status: MilestoneStatus;
  progress: number;
  tasks: Task[];
}

// ─── Task ────────────────────────────────────────────────────────

export interface Task {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  taskType: TaskType;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  rarity: Rarity;
  status: TaskStatus;
  order: number;
  completedAt: string | null;
}

// ─── Inputs ──────────────────────────────────────────────────────

export interface GenerateRoadmapInput {
  goal: string;
  currentRole: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  dailyMinutes: 15 | 30 | 60 | 90;
  selectedTools: string[];
  superpower: string;
}

export interface CompleteTaskInput {
  taskId: string;
}

// ─── SSE Events (The Forge) ──────────────────────────────────────

export interface ForgeEvent {
  type: 'progress' | 'milestone' | 'complete' | 'error';
  data: ForgeProgressData | ForgeMilestoneData | ForgeCompleteData | ForgeErrorData;
}

export interface ForgeProgressData {
  phase: string;
  percent: number;
  message: string;
}

export interface ForgeMilestoneData {
  milestone: Milestone;
  index: number;
  total: number;
}

export interface ForgeCompleteData {
  roadmap: Roadmap;
}

export interface ForgeErrorData {
  message: string;
}
