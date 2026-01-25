import { z } from 'zod';

export const DpAuthenticationLogSchema = z.object({
  Authentication_ID: z.number().int(),
  User_Name: z.string().max(256),
  Server_Name: z.string().max(75),
  IP_Address: z.string().max(50),
  Date_Time: z.string().datetime(),
  User_ID: z.number().int().nullable(),
  Referrer: z.string().max(2048).nullable(),
  Keep_Signed_In: z.boolean(),
  Last_Token_Request: z.string().datetime().nullable(),
});

export type DpAuthenticationLogInput = z.infer<typeof DpAuthenticationLogSchema>;
