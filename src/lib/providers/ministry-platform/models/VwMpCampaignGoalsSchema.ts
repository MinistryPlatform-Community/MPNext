import { z } from 'zod';

export const VwMpCampaignGoalsSchema = z.object({
  Campaign_Goal_ID: z.number().int(),
  Pledge_Campaign_ID: z.number().int(),
  Campaign_Name: z.string().max(50),
  Organization_ID: z.number().int(),
  Organization_Name: z.string().max(50),
  Goal_Amount: z.number(),
  Pledge_Count: z.number().int(),
  Original_Pledge: z.number(),
  Total_Received: z.number(),
  Adjustments: z.number(),
  Pledged: z.number().nullable(),
});

export type VwMpCampaignGoalsInput = z.infer<typeof VwMpCampaignGoalsSchema>;
