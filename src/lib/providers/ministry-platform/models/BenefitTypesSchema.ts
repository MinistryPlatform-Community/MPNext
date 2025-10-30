import { z } from 'zod';

export const BenefitTypesSchema = z.object({
  Benefit_Type_ID: z.number().int(),
  Benefit_Type: z.string().max(50),
});

export type BenefitTypesInput = z.infer<typeof BenefitTypesSchema>;
