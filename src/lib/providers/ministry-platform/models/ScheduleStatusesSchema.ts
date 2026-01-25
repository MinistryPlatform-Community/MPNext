import { z } from 'zod';

export const ScheduleStatusesSchema = z.object({
  Schedule_Status_ID: z.number().int(),
  Schedule_Status: z.string().max(50),
});

export type ScheduleStatusesInput = z.infer<typeof ScheduleStatusesSchema>;
