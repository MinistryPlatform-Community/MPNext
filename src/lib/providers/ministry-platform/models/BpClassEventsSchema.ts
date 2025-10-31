import { z } from 'zod';

export const BpClassEventsSchema = z.object({
  Class_Event_ID: z.number().int(),
  Class_ID: z.number().int(),
  Event_ID: z.number().int(),
});

export type BpClassEventsInput = z.infer<typeof BpClassEventsSchema>;
