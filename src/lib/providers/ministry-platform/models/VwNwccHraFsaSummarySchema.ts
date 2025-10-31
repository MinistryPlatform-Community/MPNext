import { z } from 'zod';

export const VwNwccHraFsaSummarySchema = z.object({
  Staff_Annual_Benefits_ID: z.number().int(),
  Staff_ID: z.number().int(),
  Benefit_Year_ID: z.number().int(),
  Starting_FSA: z.number().nullable(),
  FSA_Reimbursed: z.number(),
  FSA_Pending: z.number(),
  FSA_Remaining: z.number().nullable(),
  Staff_Benefit_HRA: z.string().max(50).nullable(),
  Max_OOP: z.number(),
  Max_Nwoods: z.number(),
  Family_Member_Deductible: z.number(),
  Family_Member_Max_Nwoods: z.number().nullable(),
  HRA_Submitted: z.number(),
  Expenses_Denied: z.number(),
  HRA_Reimbursed: z.number(),
  HRA_Pending_Reimbursed: z.number(),
  HRA_Total_Reimbursed: z.number().nullable(),
  HRA_Not_Reimbursed: z.number(),
  HRA_Deductible_Eligible: z.number(),
  Plan_OOP_Remaining: z.number().nullable(),
  HRA_Plan_Remaining: z.number().nullable(),
  Row_Name: z.string().max(176).nullable(),
});

export type VwNwccHraFsaSummaryInput = z.infer<typeof VwNwccHraFsaSummarySchema>;
