import { z } from 'zod';

export const ContactStatusesSchema = z.object({
  Contact_Status_ID: z.number().int(),
  Contact_Status: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type ContactStatusesInput = z.infer<typeof ContactStatusesSchema>;
