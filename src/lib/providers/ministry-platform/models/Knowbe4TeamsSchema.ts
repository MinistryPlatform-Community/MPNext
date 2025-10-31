import { z } from 'zod';

export const Knowbe4TeamsSchema = z.object({
  KnowBe4_Team_ID: z.number().int(),
  Team_Name: z.string().max(100),
  Description: z.string().max(1000).nullable(),
});

export type Knowbe4TeamsInput = z.infer<typeof Knowbe4TeamsSchema>;
