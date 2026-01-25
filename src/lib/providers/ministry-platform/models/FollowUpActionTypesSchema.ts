import { z } from 'zod';

export const FollowUpActionTypesSchema = z.object({
  Action_Type_ID: z.number().int(),
  Action_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type FollowUpActionTypesInput = z.infer<typeof FollowUpActionTypesSchema>;
