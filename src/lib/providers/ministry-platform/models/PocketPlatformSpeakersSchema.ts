import { z } from 'zod';

export const PocketPlatformSpeakersSchema = z.object({
  Speaker_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Display_Name: z.string().max(100),
  Bio: z.string().max(2147483647).nullable(),
});

export type PocketPlatformSpeakersInput = z.infer<typeof PocketPlatformSpeakersSchema>;
