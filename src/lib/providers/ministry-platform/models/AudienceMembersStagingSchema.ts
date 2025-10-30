import { z } from 'zod';

export const AudienceMembersStagingSchema = z.object({
  Contact_Id: z.number().int(),
  Forced_Filter: z.boolean(),
});

export type AudienceMembersStagingInput = z.infer<typeof AudienceMembersStagingSchema>;
