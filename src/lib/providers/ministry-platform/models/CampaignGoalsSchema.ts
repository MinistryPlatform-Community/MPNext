import { z } from 'zod';

export const CampaignGoalsSchema = z.object({
  Campaign_Goal_ID: z.number().int(),
  Campaign_ID: z.number().int(),
  Congregation_ID: z.number().int(),
  Goal_Amount: z.number(),
  Share_Percent_Up_to_Goal: z.number().nullable(),
  Share_Percent_Over_Goal: z.number().nullable(),
});

export type CampaignGoalsInput = z.infer<typeof CampaignGoalsSchema>;
