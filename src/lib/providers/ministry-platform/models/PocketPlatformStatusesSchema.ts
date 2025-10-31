import { z } from 'zod';

export const PocketPlatformStatusesSchema = z.object({
  Status_ID: z.number().int(),
  Status: z.string().max(50),
});

export type PocketPlatformStatusesInput = z.infer<typeof PocketPlatformStatusesSchema>;
