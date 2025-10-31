import { z } from 'zod';

export const VolunteerStatusesSchema = z.object({
  Volunteer_Status_ID: z.number().int(),
  Volunteer_Status: z.string().max(50),
});

export type VolunteerStatusesInput = z.infer<typeof VolunteerStatusesSchema>;
