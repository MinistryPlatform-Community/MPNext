import { z } from 'zod';

export const DpContactPublicationsSchema = z.object({
  Contact_Publication_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Publication_ID: z.number().int(),
  Unsubscribed: z.boolean(),
  _Synced_List_Name: z.string().max(255).nullable(),
  External_List_ID: z.string().max(50).nullable(),
  _Unsubscribe_Sync_Pending: z.boolean(),
});

export type DpContactPublicationsInput = z.infer<typeof DpContactPublicationsSchema>;
