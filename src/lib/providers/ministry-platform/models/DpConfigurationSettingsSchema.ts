import { z } from 'zod';

export const DpConfigurationSettingsSchema = z.object({
  Configuration_Setting_ID: z.number().int(),
  Application_Code: z.string().max(50),
  Key_Name: z.string().max(128),
  Value: z.string().max(4000).nullable(),
  Description: z.string().max(2000).nullable(),
  _Warning: z.string().max(250).nullable(),
  Primary_Key_Page_ID: z.number().int().nullable(),
});

export type DpConfigurationSettingsInput = z.infer<typeof DpConfigurationSettingsSchema>;
