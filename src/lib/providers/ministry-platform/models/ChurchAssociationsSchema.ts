import { z } from 'zod';

export const ChurchAssociationsSchema = z.object({
  Church_Association_ID: z.number().int(),
  Association_Name: z.string().max(128),
  Alt_Name: z.string().max(128).nullable(),
  Description: z.string().max(2000).nullable(),
  Address_ID: z.number().int().nullable(),
  Website: z.string().url().nullable(),
  Year_Established: z.number().int().nullable(),
  End_Date: z.string().datetime().nullable(),
  Review_Date: z.string().datetime().nullable(),
});

export type ChurchAssociationsInput = z.infer<typeof ChurchAssociationsSchema>;
