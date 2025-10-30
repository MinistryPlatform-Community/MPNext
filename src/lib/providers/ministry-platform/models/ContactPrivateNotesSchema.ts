import { z } from 'zod';

export const ContactPrivateNotesSchema = z.object({
  Contact_Private_Note_ID: z.number().int(),
  User_ID: z.number().int(),
  Contact_ID: z.number().int().nullable(),
  Notes: z.string().max(2000),
  Start_Date: z.string().datetime(),
});

export type ContactPrivateNotesInput = z.infer<typeof ContactPrivateNotesSchema>;
