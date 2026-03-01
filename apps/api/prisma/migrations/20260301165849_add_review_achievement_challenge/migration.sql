-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "displayName" VARCHAR(50) NOT NULL,
    "authProvider" VARCHAR(10) NOT NULL,
    "providerSubId" VARCHAR(255) NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "quietMode" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
    "publicId" VARCHAR(16),
    "anonymized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" VARCHAR(20) NOT NULL,
    "archetypeId" VARCHAR(20) NOT NULL,
    "evolutionTier" VARCHAR(20) NOT NULL DEFAULT 'novice',
    "companionId" VARCHAR(20),
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "insight" INTEGER NOT NULL DEFAULT 0,
    "influence" INTEGER NOT NULL DEFAULT 0,
    "resilience" INTEGER NOT NULL DEFAULT 0,
    "versatility" INTEGER NOT NULL DEFAULT 0,
    "discovery" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_equipment" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "slot" VARCHAR(20) NOT NULL,
    "itemId" VARCHAR(50) NOT NULL,
    "rarity" VARCHAR(20) NOT NULL DEFAULT 'common',
    "equippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "goal" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "durationDays" INTEGER NOT NULL DEFAULT 90,
    "dailyMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" VARCHAR(20) NOT NULL DEFAULT 'generating',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiModel" VARCHAR(50) NOT NULL DEFAULT 'claude-sonnet-4-6',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "weekStart" INTEGER NOT NULL,
    "weekEnd" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'locked',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "taskType" VARCHAR(20) NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "xpReward" INTEGER NOT NULL DEFAULT 25,
    "coinReward" INTEGER NOT NULL DEFAULT 5,
    "rarity" VARCHAR(20) NOT NULL DEFAULT 'common',
    "status" VARCHAR(20) NOT NULL DEFAULT 'locked',
    "order" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questType" VARCHAR(15) NOT NULL DEFAULT 'knowledge',
    "difficultyTier" INTEGER NOT NULL DEFAULT 1,
    "requiredTimeSpent" INTEGER,
    "knowledgeCheck" JSONB,
    "validationType" VARCHAR(30) NOT NULL DEFAULT 'knowledge_quiz',
    "skillDomain" VARCHAR(50),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progressions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "energyCrystals" INTEGER NOT NULL DEFAULT 3,
    "maxEnergyCrystals" INTEGER NOT NULL DEFAULT 3,
    "subscriptionTier" VARCHAR(20) NOT NULL DEFAULT 'free',
    "energyRechargeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(10) NOT NULL DEFAULT 'active',
    "lastActivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freezesUsed" INTEGER NOT NULL DEFAULT 0,
    "freezesUsedMonth" INTEGER NOT NULL DEFAULT 0,
    "maxFreezes" INTEGER NOT NULL DEFAULT 1,
    "frozenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "questType" VARCHAR(15) NOT NULL,
    "rarity" VARCHAR(12) NOT NULL,
    "baseXp" INTEGER NOT NULL,
    "bonusXp" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION,
    "validationResult" JSONB NOT NULL DEFAULT '{}',
    "timeSpentSeconds" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" VARCHAR(50) NOT NULL,
    "skillDomain" VARCHAR(50),
    "easinessFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "repetitionCount" INTEGER NOT NULL DEFAULT 0,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3) NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),
    "lastQuality" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_unlocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" VARCHAR(50) NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "difficulty" VARCHAR(10) NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetDomain" VARCHAR(50),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "xpReward" INTEGER NOT NULL,
    "coinReward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_providerSubId_key" ON "users"("providerSubId");

-- CreateIndex
CREATE UNIQUE INDEX "users_publicId_key" ON "users"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_key" ON "characters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "character_equipment_characterId_slot_key" ON "character_equipment"("characterId", "slot");

-- CreateIndex
CREATE INDEX "roadmaps_userId_idx" ON "roadmaps"("userId");

-- CreateIndex
CREATE INDEX "milestones_roadmapId_idx" ON "milestones"("roadmapId");

-- CreateIndex
CREATE INDEX "tasks_milestoneId_idx" ON "tasks"("milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "user_progressions_userId_key" ON "user_progressions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_userId_key" ON "streaks"("userId");

-- CreateIndex
CREATE INDEX "xp_events_userId_idx" ON "xp_events"("userId");

-- CreateIndex
CREATE INDEX "xp_events_createdAt_idx" ON "xp_events"("createdAt");

-- CreateIndex
CREATE INDEX "quest_completions_userId_completedAt_idx" ON "quest_completions"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "quest_completions_userId_questType_idx" ON "quest_completions"("userId", "questType");

-- CreateIndex
CREATE UNIQUE INDEX "quest_completions_userId_taskId_key" ON "quest_completions"("userId", "taskId");

-- CreateIndex
CREATE INDEX "review_items_userId_nextReview_idx" ON "review_items"("userId", "nextReview");

-- CreateIndex
CREATE INDEX "review_items_userId_masteryLevel_idx" ON "review_items"("userId", "masteryLevel");

-- CreateIndex
CREATE UNIQUE INDEX "review_items_userId_skillId_key" ON "review_items"("userId", "skillId");

-- CreateIndex
CREATE INDEX "achievement_unlocks_userId_idx" ON "achievement_unlocks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_unlocks_userId_achievementId_key" ON "achievement_unlocks"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "weekly_challenges_userId_weekStart_idx" ON "weekly_challenges"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progressions" ADD CONSTRAINT "user_progressions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_completions" ADD CONSTRAINT "quest_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_completions" ADD CONSTRAINT "quest_completions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_unlocks" ADD CONSTRAINT "achievement_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_challenges" ADD CONSTRAINT "weekly_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
