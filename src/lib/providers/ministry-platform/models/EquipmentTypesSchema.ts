import { z } from 'zod';

export const EquipmentTypesSchema = z.object({
  Equipment_Type_ID: z.number().int(),
  Equipment_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type EquipmentTypesInput = z.infer<typeof EquipmentTypesSchema>;
