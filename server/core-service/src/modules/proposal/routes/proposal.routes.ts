import { Router } from "express";
import {
  createProposal,
  getProposalById,
  getProposals,
  updateProposalStatus,
  deleteProposal,
  getProposalsByJobId,
  getMyProposals
} from "../controllers/proposal.controller";
import { protect } from "../../../middlewares/auth.middleware";

const router = Router();

// All proposal routes require authentication
router.use(protect);

// Proposal CRUD operations
router.post("/proposals", createProposal);                    // POST /proposals - Create new proposal (freelancers)
router.get("/proposals", getProposals);                       // GET /proposals - Get proposals with filters
router.get("/proposals/:id", getProposalById);                // GET /proposals/:id - Get specific proposal
router.patch("/proposals/:id/status", updateProposalStatus);  // PATCH /proposals/:id/status - Update proposal status (clients)
router.delete("/proposals/:id", deleteProposal);              // DELETE /proposals/:id - Delete proposal (freelancers)

// Job-specific proposal routes
router.get("/jobs/:jobId/proposals", getProposalsByJobId);    // GET /jobs/:jobId/proposals - Get proposals for a job (clients)

// User-specific proposal routes
router.get("/my-proposals", getMyProposals);                  // GET /my-proposals - Get freelancer's own proposals

export default router;
