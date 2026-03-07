-- CreateTable
CREATE TABLE "ai_prompt_templates" (
    "id" TEXT NOT NULL,
    "generatorType" VARCHAR(50) NOT NULL,
    "promptRole" VARCHAR(10) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "template" TEXT NOT NULL,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_prompt_templates_generatorType_isActive_idx" ON "ai_prompt_templates"("generatorType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ai_prompt_template" ON "ai_prompt_templates"("generatorType", "promptRole", "version");
