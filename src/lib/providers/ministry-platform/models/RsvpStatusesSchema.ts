import { z } from 'zod';

export const RsvpStatusesSchema = z.object({
  RSVP_Status_ID: z.number().int(),
  RSVP_Status: z.string().max(50),
});

export type RsvpStatusesInput = z.infer<typeof RsvpStatusesSchema>;
