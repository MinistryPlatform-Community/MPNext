import { z } from 'zod';

export const NeedCampaignsSchema = z.object({
  Need_Campaign_ID: z.number().int(),
  Campaign_Title: z.string().max(50),
  Campaign_Guid: z.string().uuid(),
  Description: z.string().max(500).nullable(),
  Is_Default: z.boolean(),
  Expected_Days_to_Complete: z.number().int(),
  Allow_Other_Need_Types: z.boolean(),
});

export type NeedCampaignsInput = z.infer<typeof NeedCampaignsSchema>;
