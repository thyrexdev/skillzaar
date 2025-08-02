import { Request, Response } from "express";
import { ProposalService } from "../services/proposal.service";
import { z } from "zod";
import {
  createProposalSchema,
  updateProposalStatusSchema,
  getProposalSchema,
  getProposalsSchema,
  CreateProposalRequest,
  UpdateProposalStatusRequest,
  GetProposalRequest,
  GetProposalsRequest
} from "../validators/proposal.validators";
import {
  CreateProposalResponse,
  GetProposalResponse,
  GetProposalsResponse,
  UpdateProposalStatusResponse,
  DeleteProposalResponse,
  ProposalErrorResponse,
  ValidationErrorResponse,
  GetProposalsByJobResponse,
  GetMyProposalsResponse,
} from "../interfaces/proposal.interfaces";

export const createProposal = async (
  req: Request<{}, CreateProposalResponse | ValidationErrorResponse | ProposalErrorResponse, CreateProposalRequest['body']>,
  res: Response<CreateProposalResponse | ValidationErrorResponse | ProposalErrorResponse>
) => {
  try {
    // Validate request body
    const validatedData = createProposalSchema.parse(req.body);
    
    // Get user ID from auth middleware
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const proposal = await ProposalService.createProposal(userId, validatedData.body);
    res.status(201).json({ 
      message: "Proposal submitted successfully",
      proposal 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors 
      });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getProposalById = async (
  req: Request,
  res: Response<GetProposalResponse | ProposalErrorResponse>
) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const proposal = await ProposalService.getProposalById(id, userId);
    
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    res.json({ proposal });
  } catch (error: any) {
    if (error.message === "Access denied") {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getProposals = async (
  req: Request,
  res: Response<GetProposalsResponse | ProposalErrorResponse>
) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate query parameters
    const validatedFilters = getProposalsSchema.parse(req.query);
    
    const result = await ProposalService.getProposals(userId, validatedFilters.query);
    
    res.json({
      proposals: result.proposals,
      pagination: {
        page: result.currentPage,
        limit: validatedFilters.query.limit || 10,
        total: result.totalCount,
        pages: result.totalPages
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors 
      });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateProposalStatus = async (
  req: Request,
  res: Response<UpdateProposalStatusResponse | ValidationErrorResponse | ProposalErrorResponse>
) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate request body
    const validatedData = updateProposalStatusSchema.parse(req.body);

    const proposal = await ProposalService.updateProposalStatus(
      id, 
      userId, 
      validatedData.body.status
    );

    res.json({ 
      message: "Proposal status updated successfully",
      proposal 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors 
      });
    }
    if (error.message === "Proposal not found or access denied") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Only clients can update proposal status") {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const deleteProposal = async (
  req: Request,
  res: Response<DeleteProposalResponse | ProposalErrorResponse>
) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const result = await ProposalService.deleteProposal(id, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Proposal not found or access denied") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Only freelancers can delete their proposals") {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === "Cannot delete proposal that has been processed") {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getProposalsByJobId = async (
  req: Request,
  res: Response<GetProposalsByJobResponse | ProposalErrorResponse>
) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const proposals = await ProposalService.getProposalsByJobId(jobId, userId);
    res.json({ proposals });
  } catch (error: any) {
    if (error.message === "Job not found or access denied") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Client not found") {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getMyProposals = async (
  req: Request,
  res: Response<GetMyProposalsResponse | ProposalErrorResponse>
) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const proposals = await ProposalService.getProposalsByFreelancerId(userId);
    res.json({ proposals });
  } catch (error: any) {
    if (error.message === "Freelancer not found") {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};
