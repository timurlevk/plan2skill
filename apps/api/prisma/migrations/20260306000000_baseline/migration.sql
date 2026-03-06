-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "displayName" VARCHAR(50) NOT NULL,
    "authProvider" VARCHAR(10) NOT NULL,
    "providerSubId" VARCHAR(255) NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
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
    "strength" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
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
CREATE TABLE "equipment_catalog" (
    "id" TEXT NOT NULL,
    "itemId" VARCHAR(60) NOT NULL,
    "slot" VARCHAR(20) NOT NULL,
    "rarity" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "attributeBonus" JSONB NOT NULL DEFAULT '{}',
    "pixelArt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" VARCHAR(60) NOT NULL,
    "slot" VARCHAR(20) NOT NULL,
    "rarity" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forge_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputItems" JSONB NOT NULL,
    "outputItemId" VARCHAR(60) NOT NULL,
    "outputRarity" VARCHAR(20) NOT NULL,
    "forgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forge_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_skill_domain_attributes" (
    "id" TEXT NOT NULL,
    "skillDomain" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "primaryAttr" VARCHAR(3) NOT NULL,
    "secondaryAttr" VARCHAR(3) NOT NULL,
    "primaryGrowth" INTEGER NOT NULL DEFAULT 2,
    "secondaryGrowth" INTEGER NOT NULL DEFAULT 1,
    "icon" VARCHAR(20),
    "color" VARCHAR(7),
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ref_skill_domain_attributes_pkey" PRIMARY KEY ("id")
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
    "bloomLevel" VARCHAR(15),

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
    "bloomLevel" VARCHAR(15),
    "aiGeneratedPrompt" TEXT,
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

-- CreateTable
CREATE TABLE "story_bible" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "worldName" TEXT NOT NULL DEFAULT 'Lumen',
    "worldRules" JSONB NOT NULL,
    "characters" JSONB NOT NULL,
    "geography" JSONB NOT NULL,
    "toneGuide" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_bible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season" (
    "id" TEXT NOT NULL,
    "storyBibleId" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "arcOutline" JSONB NOT NULL,
    "stateTracker" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "globalNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "contextSentence" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cliffhanger" TEXT NOT NULL,
    "sageReflection" TEXT NOT NULL,
    "illustrationUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'standard',
    "wordCount" INTEGER NOT NULL,
    "readTimeSeconds" INTEGER NOT NULL,
    "act" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "aiModelUsed" TEXT,
    "toneProfile" VARCHAR(20),
    "aiConfidence" DOUBLE PRECISION,
    "humanReviewedBy" TEXT,
    "humanReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_read_receipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readDurationSec" INTEGER,
    "xpAwarded" INTEGER NOT NULL DEFAULT 5,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'home',

    CONSTRAINT "episode_read_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "narrative_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "narrativeMode" TEXT NOT NULL DEFAULT 'full',
    "lastReadEpisode" INTEGER,
    "onboardingLegendCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narrative_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lore_entry" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referenceId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "content" TEXT NOT NULL,
    "seasonId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lore_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatorType" VARCHAR(30) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_trace" (
    "id" TEXT NOT NULL,
    "usageId" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "responseText" TEXT,
    "structuredOutput" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "llm_trace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_elo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillDomain" VARCHAR(50) NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1200,
    "assessmentCount" INTEGER NOT NULL DEFAULT 0,
    "lastAssessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_elo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" VARCHAR(255) NOT NULL,
    "generatorType" VARCHAR(30) NOT NULL,
    "content" JSONB NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_content" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "parentId" VARCHAR(100),
    "data" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ref_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intent" VARCHAR(30),
    "path" VARCHAR(30),
    "dreamGoal" TEXT,
    "domain" VARCHAR(50),
    "interests" JSONB,
    "careerTarget" VARCHAR(50),
    "pains" JSONB,
    "milestones" JSONB,
    "assessments" JSONB,
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_translations" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "field" VARCHAR(50) NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ref_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "tier" VARCHAR(20) NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_members" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyXp" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "league_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_quests" (
    "id" TEXT NOT NULL,
    "bossName" VARCHAR(100) NOT NULL,
    "bossRarity" VARCHAR(20) NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "rewardXp" INTEGER NOT NULL DEFAULT 200,
    "rewardCrystals" INTEGER NOT NULL DEFAULT 5,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_members" (
    "id" TEXT NOT NULL,
    "partyQuestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalDamage" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "selectedIndex" INTEGER,
    "answerData" JSONB,
    "correct" BOOLEAN,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeSpentSeconds" INTEGER,
    "hintsRequested" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightType" VARCHAR(30) NOT NULL,
    "skillDomain" VARCHAR(50),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "generatedBy" VARCHAR(50) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_insights_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "equipment_catalog_itemId_key" ON "equipment_catalog"("itemId");

-- CreateIndex
CREATE INDEX "idx_equipment_catalog_slot_rarity" ON "equipment_catalog"("slot", "rarity");

-- CreateIndex
CREATE INDEX "idx_equipment_catalog_active" ON "equipment_catalog"("isActive");

-- CreateIndex
CREATE INDEX "idx_inventory_user" ON "inventory_item"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_userId_itemId_key" ON "inventory_item"("userId", "itemId");

-- CreateIndex
CREATE INDEX "idx_forge_history_user" ON "forge_history"("userId");

-- CreateIndex
CREATE INDEX "ref_skill_domain_attributes_skillDomain_validTo_idx" ON "ref_skill_domain_attributes"("skillDomain", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "ref_skill_domain_attributes_skillDomain_validFrom_key" ON "ref_skill_domain_attributes"("skillDomain", "validFrom");

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

-- CreateIndex
CREATE INDEX "idx_season_number" ON "season"("seasonNumber");

-- CreateIndex
CREATE INDEX "idx_season_status" ON "season"("status");

-- CreateIndex
CREATE INDEX "idx_episode_global_number" ON "episode"("globalNumber");

-- CreateIndex
CREATE INDEX "idx_episode_publish" ON "episode"("status", "publishAt");

-- CreateIndex
CREATE INDEX "idx_episode_category" ON "episode"("category");

-- CreateIndex
CREATE UNIQUE INDEX "episode_seasonId_episodeNumber_key" ON "episode"("seasonId", "episodeNumber");

-- CreateIndex
CREATE INDEX "idx_read_receipt_user_date" ON "episode_read_receipt"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "episode_read_receipt_userId_episodeId_key" ON "episode_read_receipt"("userId", "episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "narrative_preference_userId_key" ON "narrative_preference"("userId");

-- CreateIndex
CREATE INDEX "idx_lore_entry_category" ON "lore_entry"("category", "isActive");

-- CreateIndex
CREATE INDEX "idx_lore_entry_reference" ON "lore_entry"("referenceId");

-- CreateIndex
CREATE INDEX "idx_llm_usage_user_date" ON "llm_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_llm_usage_generator_date" ON "llm_usage"("generatorType", "createdAt");

-- CreateIndex
CREATE INDEX "idx_llm_usage_date" ON "llm_usage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "llm_trace_usageId_key" ON "llm_trace"("usageId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_elo_userId_skillDomain_key" ON "skill_elo"("userId", "skillDomain");

-- CreateIndex
CREATE UNIQUE INDEX "ai_cache_cacheKey_key" ON "ai_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "idx_ai_cache_generator_expires" ON "ai_cache"("generatorType", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_ai_cache_expires" ON "ai_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_ref_content_type_active" ON "ref_content"("entityType", "active");

-- CreateIndex
CREATE INDEX "idx_ref_content_parent" ON "ref_content"("entityType", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ref_content_entityType_entityId_key" ON "ref_content"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_submissions_userId_key" ON "onboarding_submissions"("userId");

-- CreateIndex
CREATE INDEX "idx_translation_type_locale" ON "ref_translations"("entityType", "locale");

-- CreateIndex
CREATE INDEX "idx_translation_locale" ON "ref_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ref_translations_entityType_entityId_field_locale_key" ON "ref_translations"("entityType", "entityId", "field", "locale");

-- CreateIndex
CREATE INDEX "friendships_friendId_status_idx" ON "friendships"("friendId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userId_friendId_key" ON "friendships"("userId", "friendId");

-- CreateIndex
CREATE INDEX "leagues_weekStart_idx" ON "leagues"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_tier_weekStart_key" ON "leagues"("tier", "weekStart");

-- CreateIndex
CREATE INDEX "league_members_leagueId_weeklyXp_idx" ON "league_members"("leagueId", "weeklyXp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "league_members_leagueId_userId_key" ON "league_members"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "party_quests_status_weekStart_idx" ON "party_quests"("status", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "party_members_partyQuestId_userId_key" ON "party_members"("partyQuestId", "userId");

-- CreateIndex
CREATE INDEX "task_attempts_userId_taskId_idx" ON "task_attempts"("userId", "taskId");

-- CreateIndex
CREATE INDEX "task_attempts_userId_createdAt_idx" ON "task_attempts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "learner_insights_userId_insightType_idx" ON "learner_insights"("userId", "insightType");

-- CreateIndex
CREATE INDEX "learner_insights_userId_skillDomain_idx" ON "learner_insights"("userId", "skillDomain");

-- CreateIndex
CREATE INDEX "learner_insights_validUntil_idx" ON "learner_insights"("validUntil");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forge_history" ADD CONSTRAINT "forge_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "season" ADD CONSTRAINT "season_storyBibleId_fkey" FOREIGN KEY ("storyBibleId") REFERENCES "story_bible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode" ADD CONSTRAINT "episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_read_receipt" ADD CONSTRAINT "episode_read_receipt_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_trace" ADD CONSTRAINT "llm_trace_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "llm_usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_elo" ADD CONSTRAINT "skill_elo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_submissions" ADD CONSTRAINT "onboarding_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_partyQuestId_fkey" FOREIGN KEY ("partyQuestId") REFERENCES "party_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_insights" ADD CONSTRAINT "learner_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

