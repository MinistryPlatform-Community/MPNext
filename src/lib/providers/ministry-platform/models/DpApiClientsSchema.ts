import { z } from 'zod';

export const DpApiClientsSchema = z.object({
  API_Client_ID: z.number().int(),
  Display_Name: z.string().max(128),
  Client_ID: z.string().max(128),
  Client_Secret: z.unknown().nullable(),
  Client_User_ID: z.number().int().nullable(),
  Authentication_Flow_ID: z.number().int(),
  Redirect_URIs: z.string().max(4000).nullable(),
  Post_Logout_Redirect_URIs: z.string().max(4000).nullable(),
  Access_Token_Lifetime: z.number().int(),
  Identity_Token_Lifetime: z.number().int(),
  Refresh_Token_Lifetime: z.number().int(),
  Authorization_Code_Lifetime: z.number().int(),
  Is_Enabled: z.boolean(),
  Encryption_Key: z.unknown().nullable(),
  Is_Rotating_Refresh_Token: z.boolean(),
});

export type DpApiClientsInput = z.infer<typeof DpApiClientsSchema>;
