import { z } from 'zod';

export const NsmStudentsSchema = z.object({
  Student_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Setup_Date: z.string().datetime(),
  Coach: z.number().int().nullable(),
  Student_Status_ID: z.number().int(),
  Student_Type_ID: z.number().int().nullable(),
  Student_Concentration_ID: z.number().int().nullable(),
  Student_Source_ID: z.number().int().nullable(),
  Onboarding_Notes: z.string().max(2000).nullable(),
  Follow_Up_Complete: z.string().datetime().nullable(),
  Application: z.string().datetime().nullable(),
  Scholarship_Application: z.string().datetime().nullable(),
  Applied_NSM: z.boolean(),
  Applied_LCU: z.boolean(),
  FEC_Materials_Provided: z.boolean(),
  Pre_Assessment_Attended: z.string().datetime().nullable(),
  Executive_Team_Approval: z.string().datetime().nullable(),
  Accepted_NSM: z.boolean(),
  Accepted_LCU: z.boolean(),
  Residence_Served: z.string().datetime().nullable(),
  Graduation_Date: z.string().datetime().nullable(),
  Student_Graduation_Type_ID: z.number().int().nullable(),
});

export type NsmStudentsInput = z.infer<typeof NsmStudentsSchema>;
