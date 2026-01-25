import { z } from 'zod';

export const PersonnelResumeItemTypesSchema = z.object({
  Resume_Item_Type_ID: z.number().int(),
  Resume_Item_Type: z.string().max(50).nullable(),
});

export type PersonnelResumeItemTypesInput = z.infer<typeof PersonnelResumeItemTypesSchema>;
