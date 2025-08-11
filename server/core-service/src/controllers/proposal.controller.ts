import type { Context } from "hono";
import { z } from "zod";
import { ProposalService } from "../services/proposal.service";
import {
  createProposalSchema,
  updateProposalStatusSchema,
  getProposalsSchema,
} from "../validators/proposal.validator";

export const createProposal = async (c: Context) => {
  try {
    const body = await c.req.json();
    const validatedData = createProposalSchema.parse(body);

    const user = c.get("user");
    if (!user?.userId) return c.json({ error: "User not authenticated" }, 401);

    const proposal = await ProposalService.createProposal(user.userId, validatedData.body);
    return c.json({ message: "Proposal submitted successfully", proposal }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    return c.json({ error: error.message }, 400);
  }
};

export const getProposalById = async (c: Context) => {
  try {
    const proposalId = c.req.param("id");
    const user = c.get("user");
    if (!user?.userId) return c.json({ error: "User not authenticated" }, 401);

    const proposal = await ProposalService.getProposalById(proposalId, user.userId);
    if (!proposal) return c.json({ error: "Proposal not found" }, 404);

    return c.json({ proposal });
  } catch (error: any) {
    if (error.message === "Access denied") return c.json({ error: error.message }, 403);
    return c.json({ error: error.message }, 400);
  }
};

export const getProposals = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.userId) return c.json({ error: "User not authenticated" }, 401);

    const query = c.req.query();
    const validatedFilters = getProposalsSchema.parse(query);

    const result = await ProposalService.getProposals(user.userId, validatedFilters.query);

    return c.json({
      proposals: result.proposals,
      pagination: {
        page: result.currentPage,
        limit: validatedFilters.query.limit || 10,
        total: result.totalCount,
        pages: result.totalPages,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    return c.json({ error: error.message }, 400);
  }
};

export const updateProposalStatus = async (c: Context) => {
  try {
    const proposalId = c.req.param("id");
    const user = c.get("user");
    if (!user?.userId) return c.json({ error: "User not authenticated" }, 401);

    const body = await c.req.json();
    const validatedData = updateProposalStatusSchema.parse(body);

    const proposal = await ProposalService.updateProposalStatus(
      proposalId,
      user.userId,
      validatedData.body.status
    );

    return c.json({ message: "Proposal status updated successfully", proposal });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    if (error.message === "Proposal not found or access denied") return c.json({ error: error.message }, 404);
    if (error.message === "Only clients can update proposal status") return c.json({ error: error.message }, 403);
    return c.json({ error: error.message }, 400);
  }
};

export const deleteProposal = async (c: Context) => {
  try {
    const proposalId = c.req.param("id");
    const user = c.get("user");
    if (!user?.userId) return c.json({ error: "User not authenticated" }, 401);

    const result = await ProposalService.deleteProposal(proposalId, user.userId);
    return c.json(result);
  } catch (error: any) {
    if (error.message === "Proposal not found or access denied") return c.json({ error: error.message }, 404);
    if (error.message === "Only freelancers can delete their proposals") return c.json({ error: error.message }, 403);
    return c.json({ error: error.message }, 400);
  }
};

export const getProposalsByJobId = async (c: Context) => {
  try {
    const jobId = c.req.param("jobId");
    const user = c.get("user");
    if (!user?.userId) return c.json({ error: "User not authenticated" }, 401);

    const proposals = await ProposalService.getProposalsByJobId(jobId, user.userId);
    return c.json({ proposals });
  } catch (error: any) {
    if (error.message === "Job not found or access denied") return c.json({ error: error.message }, 404);
    if (error.message === "Client not found") return c.json({ error: error.message }, 403);
    return c.json({ error: error.message }, 400);
  }
};

export const getMyProposals = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.userId) return c.json({ error: "User not authenticated" }, 401);

    const proposals = await ProposalService.getProposalsByFreelancerId(user.userId);
    return c.json({ proposals });
  } catch (error: any) {
    if (error.message === "Freelancer not found") return c.json({ error: error.message }, 403);
    return c.json({ error: error.message }, 400);
  }
};
