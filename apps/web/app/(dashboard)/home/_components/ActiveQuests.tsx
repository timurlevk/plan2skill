'use client';

// ActiveQuests is now split into RoadmapCards (Zone 2) + QuestLines (Zone 4).
// This file re-exports QuestLines for backwards compatibility.
export { QuestLines as ActiveQuests } from './QuestLines';
