-- CreateEnum
CREATE TYPE "public"."report_category" AS ENUM ('MISINFORMATION', 'FAKE_NEWS', 'MISLEADING', 'FACTUAL_ERROR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."report_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."report_status" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateTable
CREATE TABLE "public"."reports" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "flaggedContent" TEXT,
    "category" "public"."report_category" NOT NULL,
    "reason" TEXT,
    "description" TEXT NOT NULL,
    "additionalContext" TEXT,
    "correction" TEXT,
    "severity" "public"."report_severity" NOT NULL DEFAULT 'MEDIUM',
    "userEmail" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "referrer" TEXT,
    "status" "public"."report_status" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
