import { z } from 'zod';
import { ProposalStatus } from '../interfaces/proposal.interface';

export const createProposalSchema = z.object({
  body: z.object({
    freelancerId: z.string().uuid({ message: 'Freelancer ID must be a valid UUID' }),
    jobId: z.string().uuid({ message: 'Job ID must be a valid UUID' }),
    coverLetter: z
      .string()
      .min(50, { message: 'Cover letter must be at least 50 characters long' })
      .max(2000, { message: 'Cover letter cannot exceed 2000 characters' }),
    proposedRate: z
      .number()
      .positive({ message: 'Proposed rate must be a positive number' })
      .max(10000, { message: 'Proposed rate cannot exceed $10,000 per hour' })
  })
});

export const updateProposalStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ProposalStatus, {
      message: 'Status must be one of: PENDING, INTERVIEWING, ACCEPTED, DECLINED'
    })
  }),
  params: z.object({
    id: z.string().uuid({ message: 'Proposal ID must be a valid UUID' })
  })
});

export const getProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Proposal ID must be a valid UUID' })
  })
});

export const getProposalsSchema = z.object({
  query: z.object({
    jobId: z.string().uuid().optional(),
    freelancerId: z.string().uuid().optional(),
    status: z.nativeEnum(ProposalStatus).optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100'
      })
  })
});

export type CreateProposalRequest = z.infer<typeof createProposalSchema>;
export type UpdateProposalStatusRequest = z.infer<typeof updateProposalStatusSchema>;
export type GetProposalRequest = z.infer<typeof getProposalSchema>;
export type GetProposalsRequest = z.infer<typeof getProposalsSchema>;
