import { z } from 'zod';

export const PledgeAdjustmentTypesSchema = z.object({
  Pledge_Adjustment_Type_ID: z.number().int(),
  Pledge_Adjustment_Type: z.string().max(128),
});

export type PledgeAdjustmentTypesInput = z.infer<typeof PledgeAdjustmentTypesSchema>;
