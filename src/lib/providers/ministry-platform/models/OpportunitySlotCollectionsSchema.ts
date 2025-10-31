import { z } from 'zod';

export const OpportunitySlotCollectionsSchema = z.object({
  Opportunity_Slot_Collection_ID: z.number().int(),
  Collection_Name: z.string().max(50),
});

export type OpportunitySlotCollectionsInput = z.infer<typeof OpportunitySlotCollectionsSchema>;
