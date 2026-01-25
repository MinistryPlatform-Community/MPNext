import { z } from 'zod';

export const MpVwLastKnownActivitySchema = z.object({
  Participant_ID: z.number().int(),
  Last_Known_Activity: z.string().datetime().nullable(),
});

export type MpVwLastKnownActivityInput = z.infer<typeof MpVwLastKnownActivitySchema>;
