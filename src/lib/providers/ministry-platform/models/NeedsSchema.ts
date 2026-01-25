import { z } from 'zod';

export const NeedsSchema = z.object({
  Need_ID: z.number().int(),
  Requester_Contact: z.number().int(),
  Postal_Code: z.string().max(15).nullable(),
  Need_Campaign_ID: z.number().int(),
  Need_Type_ID: z.number().int().nullable(),
  Other_Need: z.string().max(255).nullable(),
  Target_Date: z.string().datetime().nullable(),
  Complete: z.boolean(),
  Need_Provider_ID: z.number().int().nullable(),
  Date_Assigned: z.string().datetime().nullable(),
  Notes: z.string().max(500).nullable(),
  Need_Guid: z.string().uuid(),
  Care_Case_ID: z.number().int().nullable(),
});

export type NeedsInput = z.infer<typeof NeedsSchema>;
