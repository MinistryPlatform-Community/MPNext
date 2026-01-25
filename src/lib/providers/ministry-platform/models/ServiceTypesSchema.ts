import { z } from 'zod';

export const ServiceTypesSchema = z.object({
  Service_Type_ID: z.number().int(),
  Service_Type: z.string().max(50),
});

export type ServiceTypesInput = z.infer<typeof ServiceTypesSchema>;
