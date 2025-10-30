import { z } from 'zod';

export const MemberStatusesSchema = z.object({
  Member_Status_ID: z.number().int(),
  Member_Status: z.string().max(50),
  Can_Access_Directory: z.boolean(),
  Show_In_Directory: z.boolean(),
});

export type MemberStatusesInput = z.infer<typeof MemberStatusesSchema>;
