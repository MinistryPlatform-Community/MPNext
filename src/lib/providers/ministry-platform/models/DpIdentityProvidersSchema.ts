import { z } from 'zod';

export const DpIdentityProvidersSchema = z.object({
  Identity_Provider_ID: z.number().int(),
  Display_Name: z.string().max(50),
  Identity_Provider_Type_ID: z.number().int(),
  Client_ID: z.string().max(128),
  Client_Secret: z.unknown().nullable(),
  Metadata_Address: z.string().max(128).nullable(),
  Is_Public: z.boolean(),
  Identity_Provider_Unique_ID: z.string().uuid(),
  Settings: z.string().max(4000).nullable(),
});

export type DpIdentityProvidersInput = z.infer<typeof DpIdentityProvidersSchema>;
