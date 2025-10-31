import { z } from 'zod';

export const Knowbe4CampaignUsersSchema = z.object({
  KnowBe4_Campaign_User_ID: z.number().int(),
  KnowBe4_User_ID: z.number().int(),
  KnowBe4_Campaign_ID: z.number().int(),
  KnowBe4_Team_ID: z.number().int(),
  Enroll_Date: z.string().datetime().nullable(),
  Training_Completion_Date: z.string().datetime().nullable(),
  Training_Score: z.number().int().nullable(),
  Bonus_Points: z.number().int().nullable(),
  Bonus_Points_Note: z.string().max(1000).nullable(),
  First_PST_Date: z.string().datetime().nullable(),
  First_PST_Score: z.number().int().nullable(),
  Second_PST_Date: z.string().datetime().nullable(),
  Second_PST_Score: z.number().int().nullable(),
  Third_PST_Date: z.string().datetime().nullable(),
  Third_PST_Score: z.number().int().nullable(),
  Fourth_PST_Date: z.string().datetime().nullable(),
  Fourth_PST_Score: z.number().int().nullable(),
});

export type Knowbe4CampaignUsersInput = z.infer<typeof Knowbe4CampaignUsersSchema>;
