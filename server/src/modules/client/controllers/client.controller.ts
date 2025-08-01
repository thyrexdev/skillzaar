import { Request, Response } from "express";
import { ClientService } from "../services/client.service";
import { z } from "zod";
import { prisma } from "../../../config/prisma";
import {
  UpdateClientProfileRequest,
  ClientProfileResponse,
  ClientJobsResponse,
  ClientStatsResponse,
  UpdateClientProfileResponse,
  ClientErrorResponse,
  ValidationErrorResponse
} from "../interfaces/client.interfaces";
import { updateProfileSchema } from "../validators/client.validators";

export const getClientProfile = async (
  req: Request,
  res: Response<ClientProfileResponse | ClientErrorResponse>
) => {
  try {
    const { userId } = req.params;
    
    const client = await ClientService.getClientByUserId(userId);
    res.json({ client });
  } catch (error: any) {
    if (error.message === "Client not found" || error.message === "Job not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getClientJobs = async (
  req: Request,
  res: Response<ClientJobsResponse | ClientErrorResponse>
) => {
  try {
    const { userId } = req.params;
    
    const jobs = await ClientService.getClientJobs(userId);
    res.json({ jobs });
  } catch (error: any) {
    if (error.message === "Client not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateClientProfile = async (
  req: Request<{ userId: string }, UpdateClientProfileResponse | ValidationErrorResponse | ClientErrorResponse, UpdateClientProfileRequest>,
  res: Response<UpdateClientProfileResponse | ValidationErrorResponse | ClientErrorResponse>
) => {
  try {
    const { userId } = req.params;

    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    const updatedClient = await ClientService.updateClientProfile(
      userId,
      validatedData
    );

    res.json({
      message: "Profile updated successfully",
      client: updatedClient,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }
    if (error.message === "Client Not Found" || error.message === "Client not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Unauthorized") {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const getClientStats = async (
  req: Request,
  res: Response<ClientStatsResponse | ClientErrorResponse>
) => {
  try {
    const { userId } = req.params;
    
    const stats = await ClientService.getClientStats(userId);
    res.json({ stats });
  } catch (error: any) {
    if (error.message === "Client not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Unauthorized") {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};
