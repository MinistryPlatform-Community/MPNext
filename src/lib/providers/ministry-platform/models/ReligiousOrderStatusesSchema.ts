import { z } from 'zod';

export const ReligiousOrderStatusesSchema = z.object({
  Religious_Order_Status_ID: z.number().int(),
  Religious_Order_Status: z.string().max(50).nullable(),
});

export type ReligiousOrderStatusesInput = z.infer<typeof ReligiousOrderStatusesSchema>;
