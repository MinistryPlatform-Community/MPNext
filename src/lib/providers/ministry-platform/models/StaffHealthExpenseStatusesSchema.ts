import { z } from 'zod';

export const StaffHealthExpenseStatusesSchema = z.object({
  Expense_Status_ID: z.number().int(),
  Expense_Status: z.string().max(50),
});

export type StaffHealthExpenseStatusesInput = z.infer<typeof StaffHealthExpenseStatusesSchema>;
