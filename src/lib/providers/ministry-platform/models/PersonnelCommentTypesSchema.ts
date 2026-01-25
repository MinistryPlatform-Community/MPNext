import { z } from 'zod';

export const PersonnelCommentTypesSchema = z.object({
  Personnel_Comment_Type_ID: z.number().int(),
  Personnel_Comment_Type: z.string().max(50),
});

export type PersonnelCommentTypesInput = z.infer<typeof PersonnelCommentTypesSchema>;
