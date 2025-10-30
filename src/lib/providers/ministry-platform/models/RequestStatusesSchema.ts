import { z } from 'zod';

export const RequestStatusesSchema = z.object({
  Request_Status_ID: z.number().int(),
  Request_Status: z.string().max(50),
});

export type RequestStatusesInput = z.infer<typeof RequestStatusesSchema>;
