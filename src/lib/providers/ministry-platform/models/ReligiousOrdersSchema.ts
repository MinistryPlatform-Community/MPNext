import { z } from 'zod';

export const ReligiousOrdersSchema = z.object({
  Religious_Order_ID: z.number().int(),
  Religious_Order: z.string().max(50).nullable(),
});

export type ReligiousOrdersInput = z.infer<typeof ReligiousOrdersSchema>;
