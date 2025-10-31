import { z } from 'zod';

export const EventSlotParticipantsSchema = z.object({
  Event_Slot_Participant_ID: z.number().int(),
  Event_Slot_ID: z.number().int(),
  Event_Participant_ID: z.number().int(),
  Date: z.string().datetime(),
  Slot_Participation_Status_ID: z.number().int(),
});

export type EventSlotParticipantsInput = z.infer<typeof EventSlotParticipantsSchema>;
