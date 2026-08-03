-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'AGENT');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'DROPDOWN', 'TAGS', 'EMAIL', 'PHONE', 'CHECKBOX', 'DATE', 'MONEY', 'NUMBER', 'WEBSITE', 'LOCATION');

-- CreateEnum
CREATE TYPE "StageCategory" AS ENUM ('INITIAL', 'ACTIVE', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "CallSource" AS ENUM ('MANUAL', 'BOLNA_AI', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFieldDefinition" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL,
    "isLeadId" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary1" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary2" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOption" (
    "id" TEXT NOT NULL,
    "fieldDefId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "StageCategory" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallFeedback" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "starRating" INTEGER,
    "uniqueIdentifierValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFieldValue" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fieldDefId" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT,
    "isAiNote" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "callFeedbackId" TEXT,
    "source" "CallSource" NOT NULL DEFAULT 'MANUAL',
    "duration" INTEGER,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "recordingUrl" TEXT,
    "scheduledCallId" TEXT,
    "bolnaCallId" TEXT,
    "bolnaPayload" JSONB,
    "aiCallSummary" TEXT,
    "aiIntention" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledCall" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignLead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_workspaceId_email_key" ON "User"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "LeadFieldDefinition_workspaceId_idx" ON "LeadFieldDefinition"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadFieldDefinition_workspaceId_name_key" ON "LeadFieldDefinition"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FieldOption_fieldDefId_value_key" ON "FieldOption"("fieldDefId", "value");

-- CreateIndex
CREATE INDEX "LeadStage_workspaceId_category_idx" ON "LeadStage"("workspaceId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LeadStage_workspaceId_name_key" ON "LeadStage"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CallFeedback_workspaceId_name_key" ON "CallFeedback"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_stageId_idx" ON "Lead"("workspaceId", "stageId");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_assignedToId_idx" ON "Lead"("workspaceId", "assignedToId");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_createdAt_idx" ON "Lead"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_workspaceId_uniqueIdentifierValue_key" ON "Lead"("workspaceId", "uniqueIdentifierValue");

-- CreateIndex
CREATE INDEX "LeadFieldValue_fieldDefId_idx" ON "LeadFieldValue"("fieldDefId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadFieldValue_leadId_fieldDefId_key" ON "LeadFieldValue"("leadId", "fieldDefId");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_createdAt_idx" ON "LeadNote"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_scheduledCallId_key" ON "CallLog"("scheduledCallId");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_bolnaCallId_key" ON "CallLog"("bolnaCallId");

-- CreateIndex
CREATE INDEX "CallLog_leadId_createdAt_idx" ON "CallLog"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "CallLog_userId_createdAt_idx" ON "CallLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CallLog_createdAt_idx" ON "CallLog"("createdAt");

-- CreateIndex
CREATE INDEX "ScheduledCall_workspaceId_scheduledAt_idx" ON "ScheduledCall"("workspaceId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledCall_userId_scheduledAt_idx" ON "ScheduledCall"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Campaign_workspaceId_status_idx" ON "Campaign"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "CampaignLead_assignedToId_isCompleted_idx" ON "CampaignLead"("assignedToId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignLead_campaignId_leadId_key" ON "CampaignLead"("campaignId", "leadId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFieldDefinition" ADD CONSTRAINT "LeadFieldDefinition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOption" ADD CONSTRAINT "FieldOption_fieldDefId_fkey" FOREIGN KEY ("fieldDefId") REFERENCES "LeadFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStage" ADD CONSTRAINT "LeadStage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallFeedback" ADD CONSTRAINT "CallFeedback_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "LeadStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFieldValue" ADD CONSTRAINT "LeadFieldValue_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFieldValue" ADD CONSTRAINT "LeadFieldValue_fieldDefId_fkey" FOREIGN KEY ("fieldDefId") REFERENCES "LeadFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_callFeedbackId_fkey" FOREIGN KEY ("callFeedbackId") REFERENCES "CallFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_scheduledCallId_fkey" FOREIGN KEY ("scheduledCallId") REFERENCES "ScheduledCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- App architecture: server-side reads/writes go through Prisma
-- using the 'postgres' role, which bypasses RLS. The browser
-- only uses Supabase for auth (anon key), never for direct
-- table access. Enabling RLS with no policies therefore locks
-- down PostgREST / anon-key access to these tables entirely
-- without affecting the app. Add explicit policies later if you
-- want to expose specific tables via the Supabase JS client.

ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadFieldDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FieldOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadStage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CallFeedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadFieldValue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CallLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduledCall" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignLead" ENABLE ROW LEVEL SECURITY;
