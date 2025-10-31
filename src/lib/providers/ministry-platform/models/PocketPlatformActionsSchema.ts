import { z } from 'zod';

export const PocketPlatformActionsSchema = z.object({
  Action_ID: z.number().int(),
  Action_Type_ID: z.number().int(),
  Resource_Type_ID: z.number().int(),
  User_ID: z.number().int(),
  Value: z.string().max(255),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
});

export type PocketPlatformActionsInput = z.infer<typeof PocketPlatformActionsSchema>;
