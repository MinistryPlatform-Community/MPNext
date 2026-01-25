import { z } from 'zod';

export const SacramentPlacesSchema = z.object({
  Sacrament_Place_ID: z.number().int(),
  Place_Name: z.string().max(128),
  Description: z.string().max(1000).nullable(),
  Address_ID: z.number().int().nullable(),
  Mailing_Address_ID: z.number().int().nullable(),
  Phone: z.string().nullable(),
  Alt_Phone: z.string().nullable(),
  Fax: z.string().nullable(),
  Email: z.string().email().max(254).nullable(),
  Website: z.string().url().nullable(),
  Closed: z.boolean(),
  Church_Association_ID: z.number().int().nullable(),
});

export type SacramentPlacesInput = z.infer<typeof SacramentPlacesSchema>;
