import { z } from 'zod';

export const JourneysSchema = z.object({
  Journey_ID: z.number().int(),
  Journey_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Leadership_Team: z.number().int().nullable(),
  Gamify: z.boolean().nullable(),
  Active: z.boolean().nullable(),
  Badge: z.string().max(400).nullable(),
  Start_Date: z.string().datetime().nullable(),
  End_Date: z.string().datetime().nullable(),
  Finish_Message: z.string().max(150).nullable(),
});

export type JourneysInput = z.infer<typeof JourneysSchema>;
