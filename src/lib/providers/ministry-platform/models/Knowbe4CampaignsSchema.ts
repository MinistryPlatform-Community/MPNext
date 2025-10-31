import { z } from 'zod';

export const Knowbe4CampaignsSchema = z.object({
  KnowBe4_Campaign_ID: z.number().int(),
  KnowBe4_Training_Campaign_ID: z.number().int(),
  KnowBe4_Phishing_Campaign_ID: z.number().int(),
  Campaign_Name: z.string().max(100),
  Description: z.string().max(1000).nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
});

export type Knowbe4CampaignsInput = z.infer<typeof Knowbe4CampaignsSchema>;
