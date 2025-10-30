import { z } from 'zod';

export const NeedTypeProvidersSchema = z.object({
  Need_Type_Provider_ID: z.number().int(),
  Need_Type_ID: z.number().int().nullable(),
  Other_Need: z.string().max(255).nullable(),
  Need_Provider_ID: z.number().int(),
  Approved: z.boolean().nullable(),
});

export type NeedTypeProvidersInput = z.infer<typeof NeedTypeProvidersSchema>;
