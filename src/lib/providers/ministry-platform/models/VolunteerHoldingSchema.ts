import { z } from 'zod';

export const VolunteerHoldingSchema = z.object({
  Volunteer_Holding_ID: z.number().int(),
  Group_Participant_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Background_Check_ID: z.number().int().nullable(),
});

export type VolunteerHoldingInput = z.infer<typeof VolunteerHoldingSchema>;
