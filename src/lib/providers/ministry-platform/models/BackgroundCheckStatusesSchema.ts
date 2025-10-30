import { z } from 'zod';

export const BackgroundCheckStatusesSchema = z.object({
  Background_Check_Status_ID: z.number().int(),
  Background_Check_Status: z.string().max(50),
});

export type BackgroundCheckStatusesInput = z.infer<typeof BackgroundCheckStatusesSchema>;
