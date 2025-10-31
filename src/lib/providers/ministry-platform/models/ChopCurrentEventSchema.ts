import { z } from 'zod';

export const ChopCurrentEventSchema = z.object({
  ChOP_Current_Event_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Title: z.string().max(100).nullable(),
});

export type ChopCurrentEventInput = z.infer<typeof ChopCurrentEventSchema>;
