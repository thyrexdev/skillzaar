-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Job_category_status_idx" ON "Job"("category", "status");

-- CreateIndex
CREATE INDEX "Job_budget_status_idx" ON "Job"("budget", "status");

-- CreateIndex
CREATE INDEX "Job_status_budget_createdAt_idx" ON "Job"("status", "budget", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Job_category_budget_status_idx" ON "Job"("category", "budget", "status");
