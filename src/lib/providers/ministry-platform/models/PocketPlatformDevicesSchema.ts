import { z } from 'zod';

export const PocketPlatformDevicesSchema = z.object({
  Device_ID: z.number().int(),
  Hardware_ID: z.string().max(50),
  User_ID: z.number().int().nullable(),
  First_Seen: z.string().datetime(),
  Last_Seen: z.string().datetime(),
  Platform: z.string().max(50).nullable(),
  App_ID: z.number().int().nullable(),
});

export type PocketPlatformDevicesInput = z.infer<typeof PocketPlatformDevicesSchema>;
