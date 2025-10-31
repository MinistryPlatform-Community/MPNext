import { z } from 'zod';

export const GroupSlotParticipantsSchema = z.object({
  Group_Slot_Participant_ID: z.number().int(),
  Group_Slot_ID: z.number().int(),
  Group_Participant_ID: z.number().int(),
  Date: z.string().datetime(),
  Slot_Participation_Status_ID: z.number().int(),
});

export type GroupSlotParticipantsInput = z.infer<typeof GroupSlotParticipantsSchema>;
