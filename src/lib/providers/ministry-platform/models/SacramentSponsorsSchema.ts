import { z } from 'zod';

export const SacramentSponsorsSchema = z.object({
  Sacrament_Sponsor_ID: z.number().int(),
  Sacrament_ID: z.number().int(),
  Sponsor_ID: z.number().int().nullable(),
  Sponsor_Name: z.string().max(50).nullable(),
  Print_Order: z.number().int().nullable(),
  Sponsor_Type_ID: z.number().int().nullable(),
});

export type SacramentSponsorsInput = z.infer<typeof SacramentSponsorsSchema>;
