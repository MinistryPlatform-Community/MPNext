import { z } from 'zod';

export const FaithBackgroundsSchema = z.object({
  Faith_Background_ID: z.number().int(),
  Faith_Background: z.string().max(50),
});

export type FaithBackgroundsInput = z.infer<typeof FaithBackgroundsSchema>;
