import { z } from 'zod';

export const StaffTimeawayRequestStatusesSchema = z.object({
  Status_ID: z.number().int(),
  Status: z.string().max(50).nullable(),
  Notify_Employee: z.boolean(),
  Notify_Superivsor: z.boolean(),
  Notify_HR: z.number().int().nullable(),
  Communication_Template_ID: z.number().int().nullable(),
});

export type StaffTimeawayRequestStatusesInput = z.infer<typeof StaffTimeawayRequestStatusesSchema>;
