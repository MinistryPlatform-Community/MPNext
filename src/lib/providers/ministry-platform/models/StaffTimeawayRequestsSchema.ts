import { z } from 'zod';

export const StaffTimeawayRequestsSchema = z.object({
  Request_ID: z.number().int(),
  Staff_ID: z.number().int().nullable(),
  Date_Created: z.string().datetime(),
  Benefit_Year_ID: z.number().int(),
  Name: z.string().max(100),
  Status_ID: z.number().int(),
  Notes: z.string().max(2147483647).nullable(),
  HR_Approver: z.number().int().nullable(),
  HR_Approval_Date: z.string().datetime().nullable(),
  Supervisor_Approver: z.number().int().nullable(),
  Supervisor_Approval_Date: z.string().datetime().nullable(),
  Reason_Denied: z.string().max(1000).nullable(),
});

export type StaffTimeawayRequestsInput = z.infer<typeof StaffTimeawayRequestsSchema>;
