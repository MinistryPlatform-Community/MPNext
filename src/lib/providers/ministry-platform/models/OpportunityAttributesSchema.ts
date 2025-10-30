import { z } from 'zod';

export const OpportunityAttributesSchema = z.object({
  Opportunity_Attribute_ID: z.number().int(),
  Attribute_ID: z.number().int(),
  Opportunity_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Notes: z.string().max(255).nullable(),
});

export type OpportunityAttributesInput = z.infer<typeof OpportunityAttributesSchema>;
