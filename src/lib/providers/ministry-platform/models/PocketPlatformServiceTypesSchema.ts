import { z } from 'zod';

export const PocketPlatformServiceTypesSchema = z.object({
  Service_Type_ID: z.number().int(),
  Service_Type: z.string().max(50),
});

export type PocketPlatformServiceTypesInput = z.infer<typeof PocketPlatformServiceTypesSchema>;
