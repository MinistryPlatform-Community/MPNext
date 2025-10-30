import { z } from 'zod';

export const MetricsSchema = z.object({
  Metric_ID: z.number().int(),
  Metric_Title: z.string().max(50),
  Description: z.string().max(500).nullable(),
});

export type MetricsInput = z.infer<typeof MetricsSchema>;
