import { z } from 'zod';

export const VwNwccWeeklyCampusSummarySchema = z.object({
  Fake_ID: z.number().int().nullable(),
  Weekend: z.string().datetime().nullable(),
  Congregation_Name: z.string().max(50),
  General_Fund_Plate: z.number().nullable(),
  General_Fund_Online: z.number().nullable(),
  Designated_Plate: z.number().nullable(),
  Designated_Online: z.number().nullable(),
  Adults_6_PM: z.number(),
  Adults_9_AM: z.number(),
  Adults_11_AM: z.number(),
  Children_6_PM: z.number(),
  Children_9_AM: z.number(),
  Children_11_AM: z.number(),
  NextGen_Vol_6_PM: z.number(),
  NextGen_Vol_9_AM: z.number(),
  NextGen_Vol_11_AM: z.number(),
  REPLAY: z.number(),
  Congregation_ID: z.number().int(),
});

export type VwNwccWeeklyCampusSummaryInput = z.infer<typeof VwNwccWeeklyCampusSummarySchema>;
