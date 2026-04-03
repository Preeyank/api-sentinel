-- AlterTable
ALTER TABLE "Monitor" ALTER COLUMN "latencyThresholdMs" DROP NOT NULL,
ALTER COLUMN "latencyThresholdMs" DROP DEFAULT;
