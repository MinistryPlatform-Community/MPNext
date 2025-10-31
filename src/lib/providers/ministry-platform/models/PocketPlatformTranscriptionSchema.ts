import { z } from 'zod';

export const PocketPlatformTranscriptionSchema = z.object({
  Transcription_ID: z.number().int(),
  Transcription_Job_ID: z.string().max(50),
  User_ID: z.number().int(),
  Status_ID: z.number().int(),
  Progress_Note: z.string().max(250).nullable(),
  Sermon_ID: z.number().int(),
  Final_MP3: z.string().max(150).nullable(),
  Final_MP4: z.string().max(150).nullable(),
  Final_Transcription: z.string().max(150).nullable(),
  Raw_Transcription_Text: z.string().max(2147483647).nullable(),
  Transcription_Job_Date: z.string().datetime().nullable(),
  Transcription_Active: z.boolean(),
  MP3_Status: z.number().int(),
  MP4_Status: z.number().int(),
  TXT_Status: z.number().int(),
  M3U8_Status: z.number().int(),
  Final_M3U8: z.string().max(300).nullable(),
  Video_Duration: z.number().nullable(),
  Video_Encoding: z.string().max(7).nullable(),
  Video_Quality: z.string().max(20).nullable(),
  Thumbnail_URL: z.string().max(400).nullable(),
});

export type PocketPlatformTranscriptionInput = z.infer<typeof PocketPlatformTranscriptionSchema>;
