import { z } from 'zod';

export const EventTypeMetricsSchema = z.object({
  Event_Type_Metric_ID: z.number().int(),
  Congregation_ID: z.number().int(),
  Metric_ID: z.number().int(),
  Event_Type_ID: z.number().int(),
  Max_Value: z.number().int().nullable(),
});

export type EventTypeMetricsInput = z.infer<typeof EventTypeMetricsSchema>;
