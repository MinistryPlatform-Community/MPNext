import { z } from 'zod';

export const WifiDeviceSessionsSchema = z.object({
  Wifi_Device_Session_ID: z.number().int(),
  Wifi_Device_ID: z.number().int(),
  Session_GUID: z.string().max(128),
  Session_Start: z.string().datetime(),
  Session_End: z.string().datetime().nullable(),
  Wifi_Space: z.string().max(50),
  Duration_in_Minutes: z.number().int(),
  Contact_ID_Value: z.string().max(50).nullable(),
});

export type WifiDeviceSessionsInput = z.infer<typeof WifiDeviceSessionsSchema>;
