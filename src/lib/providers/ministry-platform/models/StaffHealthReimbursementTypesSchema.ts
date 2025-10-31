import { z } from 'zod';

export const StaffHealthReimbursementTypesSchema = z.object({
  Reimbursement_Type_ID: z.number().int(),
  Reimbursement_Type: z.string().max(50),
  ACS_GL_Account: z.number().int().nullable(),
  ACS_Checking_Account: z.number().int().nullable(),
});

export type StaffHealthReimbursementTypesInput = z.infer<typeof StaffHealthReimbursementTypesSchema>;
