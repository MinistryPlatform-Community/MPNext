import { z } from 'zod';

export const StaffHealthDetailTypesSchema = z.object({
  Health_Detail_Type_ID: z.number().int(),
  Health_Detail_Type: z.string().max(50),
  HRA_OOP_Eligible: z.boolean(),
  Evaluation_Order: z.number().int(),
  Health_Detail_Evaluation_Rule: z.string().max(500).nullable(),
  Reimbursement_Type_ID: z.number().int().nullable(),
});

export type StaffHealthDetailTypesInput = z.infer<typeof StaffHealthDetailTypesSchema>;
