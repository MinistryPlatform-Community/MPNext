import { z } from 'zod';

export const MappingValuesSchema = z.object({
  Mapping_Value_ID: z.number().int(),
  MP_FK: z.number().int().nullable(),
  Other_FK: z.number().int(),
  Type: z.string().max(50),
  Sub_Type: z.string().max(50),
});

export type MappingValuesInput = z.infer<typeof MappingValuesSchema>;
