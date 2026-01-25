import { z } from 'zod';

export const ItemStatusesSchema = z.object({
  Item_Status_ID: z.number().int(),
  Status: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type ItemStatusesInput = z.infer<typeof ItemStatusesSchema>;
