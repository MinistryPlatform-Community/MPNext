import { z } from 'zod';

export const VolunteerUnavailableDatesSchema = z.object({
  Volunteer_Unavailable_Date_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime(),
});

export type VolunteerUnavailableDatesInput = z.infer<typeof VolunteerUnavailableDatesSchema>;
