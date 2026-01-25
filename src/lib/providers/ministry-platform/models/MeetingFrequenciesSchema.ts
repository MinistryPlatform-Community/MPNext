import { z } from 'zod';

export const MeetingFrequenciesSchema = z.object({
  Meeting_Frequency_ID: z.number().int(),
  Meeting_Frequency: z.string().max(50).nullable(),
});

export type MeetingFrequenciesInput = z.infer<typeof MeetingFrequenciesSchema>;
