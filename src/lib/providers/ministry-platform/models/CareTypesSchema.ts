import { z } from 'zod';

export const CareTypesSchema = z.object({
  Care_Type_ID: z.number().int(),
  Care_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  User_ID: z.number().int().nullable(),
  Move_to_Feedback: z.boolean().nullable(),
  Move_to_Contact_Log: z.boolean().nullable(),
  Move_to_Opportunity_Responses: z.boolean().nullable(),
  Assign_to_Program: z.number().int().nullable(),
});

export type CareTypesInput = z.infer<typeof CareTypesSchema>;
