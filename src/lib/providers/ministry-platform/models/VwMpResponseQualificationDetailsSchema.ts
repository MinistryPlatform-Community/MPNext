import { z } from 'zod';

export const VwMpResponseQualificationDetailsSchema = z.object({
  ID: z.number().int().nullable(),
  Response_ID: z.number().int(),
  Group_Role_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Background_Check_Type_ID: z.number().int().nullable(),
  Background_Check: z.string().max(13),
  Certification_Type_ID: z.number().int().nullable(),
  Certification: z.string().max(13),
  Milestone_ID: z.number().int().nullable(),
  Milestone: z.string().max(10),
  Custom_Form_ID: z.number().int().nullable(),
  Form: z.string().max(13),
});

export type VwMpResponseQualificationDetailsInput = z.infer<typeof VwMpResponseQualificationDetailsSchema>;
