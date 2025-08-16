import { Context } from "hono";
import { z } from "zod";
import { ClientService } from "../services/client.service";
import {
  updateProfileSchema,
} from "../validators/client.validator";
import type {UpdateClientProfileRequest} from "../interfaces/client.interface";
import { logger } from '@vync/config';

export const getClientProfile = async (c: Context) => {
  try {
    const userId = c.req.param("userId");

    const client = await ClientService.getClientByUserId(userId);
    return c.json({ client });
  } catch (error: any) {
    logger.error(`Get client profile error: ${error.message}`);
    if (error.message === "Client not found" || error.message === "Job not found") {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: error.message }, 400);
  }
};

export const getClientJobs = async (c: Context) => {
  try {
    const userId = c.req.param("userId");

    const jobs = await ClientService.getClientJobs(userId);
    return c.json({ jobs });
  } catch (error: any) {
    logger.error(`Get client jobs error: ${error.message}`);
    if (error.message === "Client not found") {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: error.message }, 400);
  }
};

export const updateClientProfile = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const body = await c.req.json<UpdateClientProfileRequest>();
    const validatedData = updateProfileSchema.parse(body);

    const sanitizedData = {
      ...validatedData,
      avatar: validatedData.avatar ?? undefined,
      bio: validatedData.bio ?? undefined,
      company: validatedData.company ?? undefined,
      website: validatedData.website ?? undefined,
      location: validatedData.location ?? undefined,
      phone: validatedData.phone ?? undefined,
    };

    const updatedClient = await ClientService.updateClientProfile(userId, sanitizedData);

    return c.json({
      message: "Profile updated successfully",
      client: updatedClient,
    });
  } catch (error: any) {
    logger.error(`Update client profile error: ${error.message}`);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: error.issues }, 400);
    }
    if (error.message === "Client Not Found" || error.message === "Client not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "Unauthorized") {
      return c.json({ error: error.message }, 403);
    }
    return c.json({ error: error.message }, 400);
  }
};

export const getClientStats = async (c: Context) => {
  try {
    const userId = c.req.param("userId");

    const stats = await ClientService.getClientStats(userId);
    return c.json({ stats });
  } catch (error: any) {
    if (error.message === "Client not found") {
      return c.json({ error: error.message }, 404);
    }
    if (error.message === "Unauthorized") {
      return c.json({ error: error.message }, 403);
    }
    return c.json({ error: error.message }, 400);
  }
};
