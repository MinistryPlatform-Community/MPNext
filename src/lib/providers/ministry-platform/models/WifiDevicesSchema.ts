import { z } from 'zod';

export const WifiDevicesSchema = z.object({
  Wifi_Device_ID: z.number().int(),
  Hardware_Mac: z.string().max(50),
  Contact_ID: z.number().int().nullable(),
  First_Name: z.string().max(50).nullable(),
  Last_Name: z.string().max(50).nullable(),
  Email_Address: z.string().email().max(254).nullable(),
  Mobile_Phone: z.string().nullable(),
  Start_Date: z.string().datetime(),
});

export type WifiDevicesInput = z.infer<typeof WifiDevicesSchema>;
