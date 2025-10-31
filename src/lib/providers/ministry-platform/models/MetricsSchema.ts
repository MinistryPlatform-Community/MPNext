import { z } from 'zod';

export const MetricsSchema = z.object({
  Metric_ID: z.number().int(),
  Metric_Title: z.string().max(50),
  Metric_Type: z.string().max(50).nullable(),
  Description: z.string().max(500).nullable(),
  PP_Platform: z.string().max(10).nullable(),
  Live_Multiplier: z.number(),
  Replay_Multiplier: z.number(),
});

export type MetricsInput = z.infer<typeof MetricsSchema>;
