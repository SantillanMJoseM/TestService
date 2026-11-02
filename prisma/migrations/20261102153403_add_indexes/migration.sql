-- CreateIndex
CREATE INDEX "defects_projectId_idx" ON "defects"("projectId");

-- CreateIndex
CREATE INDEX "defects_executionId_idx" ON "defects"("executionId");

-- CreateIndex
CREATE INDEX "executions_projectId_idx" ON "executions"("projectId");

-- CreateIndex
CREATE INDEX "executions_testCaseId_idx" ON "executions"("testCaseId");

-- CreateIndex
CREATE INDEX "executions_testCycleId_idx" ON "executions"("testCycleId");

-- CreateIndex
CREATE INDEX "modules_projectId_idx" ON "modules"("projectId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "test_cases_projectId_idx" ON "test_cases"("projectId");

-- CreateIndex
CREATE INDEX "test_cases_moduleId_idx" ON "test_cases"("moduleId");

-- CreateIndex
CREATE INDEX "test_cases_versionId_idx" ON "test_cases"("versionId");

-- CreateIndex
CREATE INDEX "test_cycles_projectId_idx" ON "test_cycles"("projectId");

-- CreateIndex
CREATE INDEX "test_cycles_versionId_idx" ON "test_cycles"("versionId");

-- CreateIndex
CREATE INDEX "uat_approvals_projectId_idx" ON "uat_approvals"("projectId");

-- CreateIndex
CREATE INDEX "uat_approvals_versionId_idx" ON "uat_approvals"("versionId");

-- CreateIndex
CREATE INDEX "user_projects_projectId_idx" ON "user_projects"("projectId");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "versions_projectId_idx" ON "versions"("projectId");
