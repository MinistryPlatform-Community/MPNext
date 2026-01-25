import { z } from 'zod';

export const ParticipationStatusesSchema = z.object({
  Participation_Status_ID: z.number().int(),
  Participation_Status: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type ParticipationStatusesInput = z.infer<typeof ParticipationStatusesSchema>;
