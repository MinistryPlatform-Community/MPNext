import { z } from 'zod';

export const PledgeCampaignTypesSchema = z.object({
  Pledge_Campaign_Type_ID: z.number().int(),
  Campaign_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type PledgeCampaignTypesInput = z.infer<typeof PledgeCampaignTypesSchema>;
