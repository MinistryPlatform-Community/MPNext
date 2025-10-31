import { z } from 'zod';

export const SecureCommentTypesSchema = z.object({
  Secure_Comment_Type_ID: z.number().int(),
  Secure_Comment_Type: z.string().max(50),
  Red_Flag_Notes: z.string().max(50).nullable(),
});

export type SecureCommentTypesInput = z.infer<typeof SecureCommentTypesSchema>;
