import { z } from 'zod';

export const ParticipantCertificationsSchema = z.object({
  Participant_Certification_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Certification_Type_ID: z.number().int(),
  Certification_Submitted: z.string().datetime(),
  Certification_Completed: z.string().datetime().nullable(),
  Passed: z.boolean().nullable(),
  Certification_Expires: z.string().datetime().nullable(),
  Certification_GUID: z.string().uuid(),
  Notes: z.string().max(500).nullable(),
});

export type ParticipantCertificationsInput = z.infer<typeof ParticipantCertificationsSchema>;
