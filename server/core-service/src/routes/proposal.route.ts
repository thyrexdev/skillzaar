import { Hono } from "hono";
import {
  createProposal,
  getProposalById,
  getProposals,
  updateProposalStatus,
  deleteProposal,
  getProposalsByJobId,
  getMyProposals,
} from "../controllers/proposal.controller";
import { authMiddleware } from "@vync/shared/src";

const proposalRoutes = new Hono();

// ✅ كل الراوتس require JWT
proposalRoutes.use("*", authMiddleware);

// CRUD Proposals
proposalRoutes.post("/proposals", createProposal);                         // POST /proposals
proposalRoutes.get("/proposals", getProposals);                            // GET /proposals
proposalRoutes.get("/proposals/:id", getProposalById);                     // GET /proposals/:id
proposalRoutes.patch("/proposals/:id/status", updateProposalStatus);      // PATCH /proposals/:id/status
proposalRoutes.delete("/proposals/:id", deleteProposal);                  // DELETE /proposals/:id

// Job-specific proposals
proposalRoutes.get("/jobs/:jobId/proposals", getProposalsByJobId);        // GET /jobs/:jobId/proposals

// Freelancer's own proposals
proposalRoutes.get("/my-proposals", getMyProposals);                      // GET /my-proposals

export default proposalRoutes;
