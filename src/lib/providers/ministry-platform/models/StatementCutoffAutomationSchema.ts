import { z } from 'zod';

export const StatementCutoffAutomationSchema = z.object({
  Statement_Cutoff_Automation_ID: z.number().int(),
  Automation_Type: z.string().max(50),
  Automation_Description: z.string().max(500).nullable(),
});

export type StatementCutoffAutomationInput = z.infer<typeof StatementCutoffAutomationSchema>;
