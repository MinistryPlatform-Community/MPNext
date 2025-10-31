import { z } from 'zod';

export const MilestoneAutomationRulesSchema = z.object({
  Milestone_Automation_Rule_ID: z.number().int(),
  Automation_Rule: z.string().max(50),
  Automation_Notes: z.string().max(500).nullable(),
});

export type MilestoneAutomationRulesInput = z.infer<typeof MilestoneAutomationRulesSchema>;
