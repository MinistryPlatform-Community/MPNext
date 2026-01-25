import { z } from 'zod';

export const MpVwPossibleLeadersSchema = z.object({
  Contact_ID: z.number().int(),
  Participant_ID: z.number().int(),
});

export type MpVwPossibleLeadersInput = z.infer<typeof MpVwPossibleLeadersSchema>;
