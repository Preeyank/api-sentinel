-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('PROD', 'STAGING', 'DEV');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('TIMEOUT', 'DNS_ERROR', 'CONNECTION_ERROR', 'STATUS_MISMATCH');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('FAILURE', 'LATENCY');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "intervalSec" INTEGER NOT NULL,
    "expectedStatus" INTEGER NOT NULL DEFAULT 200,
    "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "environment" "Environment" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextCheckAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3),

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckResult" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INTEGER,
    "latencyMs" INTEGER,
    "errorType" "ErrorType",
    "responseSnippet" VARCHAR(500),

    CONSTRAINT "CheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "aiTriageText" TEXT,
    "aiGeneratedAt" TIMESTAMP(3),
    "aiModel" TEXT,
    "incidentSnapshot" JSONB,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Monitor_slug_key" ON "Monitor"("slug");

-- CreateIndex
CREATE INDEX "Monitor_userId_idx" ON "Monitor"("userId");

-- CreateIndex
CREATE INDEX "Monitor_isActive_idx" ON "Monitor"("isActive");

-- CreateIndex
CREATE INDEX "Monitor_nextCheckAt_isActive_idx" ON "Monitor"("nextCheckAt", "isActive");

-- CreateIndex
CREATE INDEX "CheckResult_monitorId_checkedAt_idx" ON "CheckResult"("monitorId", "checkedAt");

-- CreateIndex
CREATE INDEX "Incident_monitorId_status_idx" ON "Incident"("monitorId", "status");

-- CreateIndex
CREATE INDEX "Incident_monitorId_startedAt_idx" ON "Incident"("monitorId", "startedAt");

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckResult" ADD CONSTRAINT "CheckResult_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
