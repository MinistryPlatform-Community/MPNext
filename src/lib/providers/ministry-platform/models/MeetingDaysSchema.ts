import { z } from 'zod';

export const MeetingDaysSchema = z.object({
  Meeting_Day_ID: z.number().int(),
  Meeting_Day: z.string().max(50),
});

export type MeetingDaysInput = z.infer<typeof MeetingDaysSchema>;
