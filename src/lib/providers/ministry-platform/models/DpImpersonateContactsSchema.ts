import { z } from 'zod';

export const DpImpersonateContactsSchema = z.object({
  Impersonate_Contact_ID: z.number().int(),
  User_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Notes: z.string().max(255).nullable(),
});

export type DpImpersonateContactsInput = z.infer<typeof DpImpersonateContactsSchema>;
