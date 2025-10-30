import { z } from 'zod';

export const DpSecureConfigurationSettingsSchema = z.object({
  Secure_Configuration_Setting_ID: z.number().int(),
  Application_Code: z.string().max(50),
  Key_Name: z.string().max(128),
  Value: z.unknown().nullable(),
  Description: z.string().max(2000).nullable(),
  _Warning: z.string().max(250).nullable(),
});

export type DpSecureConfigurationSettingsInput = z.infer<typeof DpSecureConfigurationSettingsSchema>;
