import { z } from 'zod';

export const PocketPlatformGceSchema = z.object({
  GCE_ID: z.number().int(),
  Title: z.string().max(100),
  Content: z.string().max(2147483647),
  Show_Header: z.boolean(),
  Imported_ID: z.string().max(1000).nullable(),
  Congregation_ID: z.number().int().nullable(),
});

export type PocketPlatformGceInput = z.infer<typeof PocketPlatformGceSchema>;
