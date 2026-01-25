import { z } from 'zod';

export const TextingComplianceLevelsSchema = z.object({
  Texting_Compliance_Level_ID: z.number().int(),
  Texting_Compliance_Level: z.string().max(50),
});

export type TextingComplianceLevelsInput = z.infer<typeof TextingComplianceLevelsSchema>;
