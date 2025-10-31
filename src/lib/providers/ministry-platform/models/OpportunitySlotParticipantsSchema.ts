import { z } from 'zod';

export const OpportunitySlotParticipantsSchema = z.object({
  Opportunity_Slot_Participant_ID: z.number().int(),
  Opportunity_Slot_ID: z.number().int(),
  Response_ID: z.number().int(),
  Date: z.string().datetime(),
  Slot_Participation_Status_ID: z.number().int(),
});

export type OpportunitySlotParticipantsInput = z.infer<typeof OpportunitySlotParticipantsSchema>;
