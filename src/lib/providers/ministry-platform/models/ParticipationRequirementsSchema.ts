import { z } from 'zod';

export const ParticipationRequirementsSchema = z.object({
  Participation_Requirement_ID: z.number().int(),
  Group_Role_ID: z.number().int(),
  Background_Check_Type_ID: z.number().int().nullable(),
  Certification_Type_ID: z.number().int().nullable(),
  Milestone_ID: z.number().int().nullable(),
  Custom_Form_ID: z.number().int().nullable(),
  Strictly_Enforced: z.boolean(),
  Requirement_Name: z.string().max(75).nullable(),
});

export type ParticipationRequirementsInput = z.infer<typeof ParticipationRequirementsSchema>;
