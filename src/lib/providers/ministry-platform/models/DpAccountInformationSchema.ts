import { z } from 'zod';

export const DpAccountInformationSchema = z.object({
  Account_Information_ID: z.number().int(),
  Congregation_ID: z.number().int().nullable(),
  Integration_Definition_Type_ID: z.number().int(),
  API_Key: z.unknown().nullable(),
  Username: z.string().max(100).nullable(),
  Password: z.unknown().nullable(),
  Base_URL: z.string().max(500).nullable(),
  Enabled: z.boolean(),
});

export type DpAccountInformationInput = z.infer<typeof DpAccountInformationSchema>;
