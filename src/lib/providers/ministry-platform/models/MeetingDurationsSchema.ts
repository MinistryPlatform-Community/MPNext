import { z } from 'zod';

export const MeetingDurationsSchema = z.object({
  Meeting_Duration_ID: z.number().int(),
  Meeting_Duration: z.string().max(128),
  Meeting_Duration_Minutes: z.number().int(),
});

export type MeetingDurationsInput = z.infer<typeof MeetingDurationsSchema>;
