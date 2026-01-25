import { z } from 'zod';

export const RoomUsageTypesSchema = z.object({
  Room_Usage_Type_ID: z.number().int(),
  Room_Usage_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type RoomUsageTypesInput = z.infer<typeof RoomUsageTypesSchema>;
