import { z } from 'zod';

export const VwMpParticipationComplianceDetailsSchema = z.object({
  ID: z.number().int().nullable(),
  Compliance_ID: z.number().int().nullable(),
  Group_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Group_Participant_ID: z.number().int(),
  Group_Role_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Background_Check_Type_ID: z.number().int().nullable(),
  Background_Check: z.string().max(13),
  Certification_Type_ID: z.number().int().nullable(),
  Certification: z.string().max(13),
  Milestone_ID: z.number().int().nullable(),
  Milestone: z.string().max(10),
  Custom_Form_ID: z.number().int().nullable(),
  Form: z.string().max(13),
});

export type VwMpParticipationComplianceDetailsInput = z.infer<typeof VwMpParticipationComplianceDetailsSchema>;
