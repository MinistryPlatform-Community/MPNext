import { z } from 'zod';

export const CareSchedulesSchema = z.object({
  Care_Schedule_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Schedule_Start: z.string().datetime(),
  Schedule_End: z.string().datetime(),
  Care_Schedule_Type_ID: z.number().int(),
  Schedule_Notes: z.string().max(500).nullable(),
  Location_ID: z.number().int(),
  Cancelled: z.boolean(),
});

export type CareSchedulesInput = z.infer<typeof CareSchedulesSchema>;
