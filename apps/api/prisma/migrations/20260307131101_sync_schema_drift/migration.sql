-- AlterTable
ALTER TABLE "roadmaps" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "domainCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "domainMeta" JSONB,
ADD COLUMN     "hasCodingComponent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPhysicalComponent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_progressions" ADD COLUMN     "aiExplainsToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiHintsToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiTutorToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastResetDate" VARCHAR(10) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "quest_content" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "articleBody" TEXT,
    "codeChallenge" JSONB,
    "resources" JSONB,
    "funFacts" JSONB,
    "quizQuestions" JSONB,
    "contentBlocks" JSONB,
    "exercises" JSONB,
    "contentFormat" VARCHAR(30) NOT NULL DEFAULT 'article',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatorMeta" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',

    CONSTRAINT "quest_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_unlocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "feature" VARCHAR(30) NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quest_content_taskId_key" ON "quest_content"("taskId");

-- CreateIndex
CREATE INDEX "quest_content_taskId_idx" ON "quest_content"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_unlocks_userId_taskId_feature_key" ON "feature_unlocks"("userId", "taskId", "feature");

-- AddForeignKey
ALTER TABLE "quest_content" ADD CONSTRAINT "quest_content_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_unlocks" ADD CONSTRAINT "feature_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_unlocks" ADD CONSTRAINT "feature_unlocks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
