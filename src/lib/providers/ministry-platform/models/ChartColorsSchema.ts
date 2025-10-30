import { z } from 'zod';

export const ChartColorsSchema = z.object({
  Chart_Color_ID: z.number().int(),
  Chart_Color: z.unknown(),
});

export type ChartColorsInput = z.infer<typeof ChartColorsSchema>;
