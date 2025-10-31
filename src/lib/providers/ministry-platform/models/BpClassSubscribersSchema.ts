import { z } from 'zod';

export const BpClassSubscribersSchema = z.object({
  Class_Subscriber_ID: z.number().int(),
  Class_ID: z.number().int(),
  Contact_ID: z.number().int(),
  End_Date: z.string().datetime().nullable(),
});

export type BpClassSubscribersInput = z.infer<typeof BpClassSubscribersSchema>;
