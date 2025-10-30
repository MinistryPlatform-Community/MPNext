import { z } from 'zod';

export const PersonnelResumeItemsSchema = z.object({
  Personnel_Resume_Item_ID: z.number().int(),
  Personnel_ID: z.number().int(),
  Resume_Item: z.string().max(249),
  Resume_Item_Type_ID: z.number().int(),
  Resume_Item_Notes: z.string().max(2000).nullable(),
  Date_Started: z.string().datetime().nullable(),
  Date_Achieved: z.string().datetime().nullable(),
  Date_Expires: z.string().datetime().nullable(),
  Location_ID: z.number().int().nullable(),
  Place: z.string().max(500).nullable(),
});

export type PersonnelResumeItemsInput = z.infer<typeof PersonnelResumeItemsSchema>;
