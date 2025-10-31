import { z } from 'zod';

export const MinistryWeekTypesSchema = z.object({
  Ministry_Week_Type_ID: z.number().int(),
  Ministry_Week_Type: z.string().max(50),
});

export type MinistryWeekTypesInput = z.infer<typeof MinistryWeekTypesSchema>;
