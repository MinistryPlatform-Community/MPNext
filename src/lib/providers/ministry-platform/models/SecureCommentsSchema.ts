import { z } from 'zod';

export const SecureCommentsSchema = z.object({
  Secure_Comment_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Comment_Date: z.string().datetime(),
  Secure_Comment_Type_ID: z.number().int(),
  Secure_Comment: z.string().max(2147483647),
});

export type SecureCommentsInput = z.infer<typeof SecureCommentsSchema>;
