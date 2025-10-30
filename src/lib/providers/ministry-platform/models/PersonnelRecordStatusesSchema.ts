import { z } from 'zod';

export const PersonnelRecordStatusesSchema = z.object({
  Personnel_Record_Status_ID: z.number().int(),
  Personnel_Record_Status: z.string().max(50),
});

export type PersonnelRecordStatusesInput = z.infer<typeof PersonnelRecordStatusesSchema>;
