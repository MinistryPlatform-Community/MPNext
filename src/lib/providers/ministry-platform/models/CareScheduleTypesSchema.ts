import { z } from 'zod';

export const CareScheduleTypesSchema = z.object({
  Care_Schedule_Type_ID: z.number().int(),
  Schedule_Type: z.string().max(50),
});

export type CareScheduleTypesInput = z.infer<typeof CareScheduleTypesSchema>;
