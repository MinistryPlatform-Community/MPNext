import { z } from 'zod';

export const PersonnelCommentsSchema = z.object({
  Personnel_Comment_ID: z.number().int(),
  Personnel_ID: z.number().int(),
  Comment_Date: z.string().datetime(),
  Personnel_Comment_Type_ID: z.number().int(),
  Comment: z.string().max(2000),
});

export type PersonnelCommentsInput = z.infer<typeof PersonnelCommentsSchema>;
