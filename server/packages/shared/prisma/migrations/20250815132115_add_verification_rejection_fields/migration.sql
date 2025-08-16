-- AlterTable
ALTER TABLE "public"."VerificationDocument" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "VerificationDocument_status_reviewedAt_idx" ON "public"."VerificationDocument"("status", "reviewedAt");
