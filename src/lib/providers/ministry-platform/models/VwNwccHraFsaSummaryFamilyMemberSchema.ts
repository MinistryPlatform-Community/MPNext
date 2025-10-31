import { z } from 'zod';

export const VwNwccHraFsaSummaryFamilyMemberSchema = z.object({
  Read_Only_PK: z.number().int().nullable(),
  Staff_Annual_Benefits_ID: z.number().int(),
  Individual: z.number().int(),
  Individual_Submitted: z.number(),
  HRA_Qualified: z.boolean().nullable(),
  Household_Position: z.string().max(25).nullable(),
  Employee_Only_Plan: z.boolean().nullable(),
  Is_Employee: z.boolean().nullable(),
  Individual_HRA_Submitted: z.number(),
  Individual_Deductible_Eligible: z.number().nullable(),
  Individual_Deductible: z.number(),
  Individual_Deductible_Remaining: z.number().nullable(),
  OOP_Needed: z.number().nullable(),
  Individual_HRA_Reimbursed: z.number(),
  Reimbursement_Possible: z.number().nullable(),
  Individual_FSA_Reimbursed: z.number(),
});

export type VwNwccHraFsaSummaryFamilyMemberInput = z.infer<typeof VwNwccHraFsaSummaryFamilyMemberSchema>;
