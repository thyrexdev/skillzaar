import { Request, Response } from "express";
import { ClientService } from "../services/client.service";
import { z } from "zod";
import { prisma } from "../config/prisma";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").optional(),
  avatar: z.string().url("Invalid URL format").nullable().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").nullable().optional(),
  company: z.string().nullable().optional(),
  website: z.string().url("Invalid URL format").nullable().optional(),
  location: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const getClientProfile = async (req: Request, res: Response) => {
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

export const getClientJobs = async (req: Request, res: Response) => {
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

export const updateClientProfile = async (req: Request, res: Response) => {
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

export const getClientStats = async (req: Request, res: Response) => {
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
