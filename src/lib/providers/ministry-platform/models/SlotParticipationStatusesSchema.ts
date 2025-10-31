import { z } from 'zod';

export const SlotParticipationStatusesSchema = z.object({
  Slot_Participation_Status_ID: z.number().int(),
  Slot_Participation_Status: z.string().max(50),
});

export type SlotParticipationStatusesInput = z.infer<typeof SlotParticipationStatusesSchema>;
