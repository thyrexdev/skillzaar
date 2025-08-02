-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'INTERVIEWING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING';
