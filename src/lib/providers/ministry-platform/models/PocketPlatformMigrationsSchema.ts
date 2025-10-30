import { z } from 'zod';

export const PocketPlatformMigrationsSchema = z.object({
  Migration_Version: z.number().int(),
});

export type PocketPlatformMigrationsInput = z.infer<typeof PocketPlatformMigrationsSchema>;
