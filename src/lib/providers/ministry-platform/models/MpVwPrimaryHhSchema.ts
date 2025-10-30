import { z } from 'zod';

export const MpVwPrimaryHhSchema = z.object({
  Household_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Household_Position_ID: z.number().int(),
});

export type MpVwPrimaryHhInput = z.infer<typeof MpVwPrimaryHhSchema>;
