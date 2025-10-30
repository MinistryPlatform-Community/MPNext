import { z } from 'zod';

export const StaffSchema = z.object({
  Staff_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Title: z.string().max(50),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Show_Online: z.boolean(),
  Online_Order: z.unknown(),
  Facebook_URL: z.string().url().nullable(),
});

export type StaffInput = z.infer<typeof StaffSchema>;
