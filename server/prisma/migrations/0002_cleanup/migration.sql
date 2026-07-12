-- Drop redundant capacity field (capacityTeams/capacityPeople used instead)
ALTER TABLE "Room" DROP COLUMN "capacity";

-- Add missing indexes on frequently queried foreign keys
CREATE INDEX "InviteLink_hackathonId_idx" ON "InviteLink"("hackathonId");
CREATE INDEX "Registration_hackathonId_idx" ON "Registration"("hackathonId");
CREATE INDEX "Participant_teamId_idx" ON "Participant"("teamId");
CREATE INDEX "Message_hackathonId_idx" ON "Message"("hackathonId");
CREATE INDEX "MessageRecipient_messageId_idx" ON "MessageRecipient"("messageId");
CREATE INDEX "MessageRecipient_teamId_idx" ON "MessageRecipient"("teamId");
CREATE INDEX "Certificate_hackathonId_idx" ON "Certificate"("hackathonId");
CREATE INDEX "ActivityLog_hackathonId_idx" ON "ActivityLog"("hackathonId");
CREATE INDEX "Automation_hackathonId_idx" ON "Automation"("hackathonId");
CREATE INDEX "Automation_createdById_idx" ON "Automation"("createdById");
CREATE INDEX "ProblemStatement_hackathonId_idx" ON "ProblemStatement"("hackathonId");
CREATE INDEX "EventMilestone_hackathonId_idx" ON "EventMilestone"("hackathonId");
