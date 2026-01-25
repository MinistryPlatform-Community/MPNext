import { z } from 'zod';

export const LettersSchema = z.object({
  Letter_ID: z.number().int(),
  Letter_Title: z.string().max(50),
  Page_ID: z.number().int().nullable(),
  Letter_Opening: z.string().max(2147483647).nullable(),
  Letter_Body: z.string().max(2147483647).nullable(),
  Letter_From: z.string().max(2147483647).nullable(),
  Active: z.boolean(),
  Congregation_ID: z.number().int().nullable(),
});

export type LettersInput = z.infer<typeof LettersSchema>;
