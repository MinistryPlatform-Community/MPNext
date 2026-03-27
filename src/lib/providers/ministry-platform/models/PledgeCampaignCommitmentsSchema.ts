import { z } from 'zod';

export const PledgeCampaignCommitmentsSchema = z.object({
  Commitment_ID: z.number().int(),
  Pledge_Campaign_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Commitment_Date: z.string().datetime(),
  First_Name: z.string().max(50).nullable(),
  Last_Name: z.string().max(50).nullable(),
  Phone: z.string().max(50).nullable(),
  Email_Address: z.string().max(254).nullable(),
  Birthday: z.string().datetime().nullable(),
  Spouse_First: z.string().max(50).nullable(),
  Spouse_Last: z.string().max(50).nullable(),
  Spouse_Phone: z.string().max(50).nullable(),
  Spouse_Email_Address: z.string().max(254).nullable(),
  Spouse_Birthday: z.string().datetime().nullable(),
  Contact_Me: z.boolean(),
  Previous_Annual_Giving: z.number(),
  Expanded_Annual_Giving: z.number(),
  Two_Year_Commitment: z.number().nullable(),
  Kickoff_Giving: z.number(),
  Step_Fearless: z.boolean(),
  Step_Above_and_Beyond: z.boolean(),
  Step_Tithing: z.boolean(),
  Step_Percentage: z.boolean(),
  Step_Consistent: z.boolean(),
  Include_Spouse_Giving: z.boolean(),
  Pledge_Status_ID: z.number().int(),
  Pledge_ID: z.number().int().nullable(),
});

export type PledgeCampaignCommitmentsInput = z.infer<typeof PledgeCampaignCommitmentsSchema>;
