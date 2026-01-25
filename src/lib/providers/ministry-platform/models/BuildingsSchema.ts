import { z } from 'zod';

export const BuildingsSchema = z.object({
  Building_ID: z.number().int(),
  Building_Name: z.string().max(50),
  Location_ID: z.number().int(),
  Description: z.string().max(255).nullable(),
  Next_Inspection_Date: z.string().datetime().nullable(),
  Building_Coordinator: z.number().int().nullable(),
  Date_Acquired: z.string().datetime().nullable(),
  Date_Constructed: z.string().datetime().nullable(),
  Date_Retired: z.string().datetime().nullable(),
});

export type BuildingsInput = z.infer<typeof BuildingsSchema>;
