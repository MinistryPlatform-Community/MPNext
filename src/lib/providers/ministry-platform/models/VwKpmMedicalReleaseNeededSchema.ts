import { z } from 'zod';

export const VwKpmMedicalReleaseNeededSchema = z.object({
  Read_Only_PK: z.number().int(),
  Participant_ID: z.number().int(),
  Event_ID: z.number().int(),
  Registration_Date: z.string().datetime().nullable(),
  Head_1_ID: z.number().int().nullable(),
  Head_2_ID: z.number().int().nullable(),
  Contact_ID: z.number().int(),
  Event_Participant_ID: z.number().int(),
  Group_Participant_ID: z.number().int().nullable(),
});

export type VwKpmMedicalReleaseNeededInput = z.infer<typeof VwKpmMedicalReleaseNeededSchema>;
