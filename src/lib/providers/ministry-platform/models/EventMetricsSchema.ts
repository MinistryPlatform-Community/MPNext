import { z } from 'zod';

export const EventMetricsSchema = z.object({
  Event_Metric_ID: z.number().int(),
  Event_ID: z.number().int(),
  Metric_ID: z.number().int(),
  Numerical_Value: z.number(),
  Group_ID: z.number().int().nullable(),
});

export type EventMetricsInput = z.infer<typeof EventMetricsSchema>;
