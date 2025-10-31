import { z } from 'zod';

export const FeedbackTypesSchema = z.object({
  Feedback_Type_ID: z.number().int(),
  Feedback_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Group_ID: z.number().int().nullable(),
});

export type FeedbackTypesInput = z.infer<typeof FeedbackTypesSchema>;
