import { z } from 'zod';

export const PocketPlatformTranscriptionStatusesSchema = z.object({
  Transcription_Status_ID: z.number().int(),
  Status_Name: z.string().max(50),
});

export type PocketPlatformTranscriptionStatusesInput = z.infer<typeof PocketPlatformTranscriptionStatusesSchema>;
