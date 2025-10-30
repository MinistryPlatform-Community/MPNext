import { z } from 'zod';

export const PersonnelOrdinationSchema = z.object({
  Personnel_Ordination_ID: z.number().int(),
  Personnel_ID: z.number().int(),
  Deacon_Ordained_Here: z.number().int().nullable(),
  Deacon_Ordained_By: z.string().max(100).nullable(),
  First_Mass: z.string().max(100).nullable(),
  Candidacy: z.string().datetime().nullable(),
  Rite_Of_Lector: z.string().datetime().nullable(),
  Rite_Of_Acolyte: z.string().datetime().nullable(),
  Date_To_Priesthood: z.string().datetime().nullable(),
  Religious_Order_ID: z.number().int().nullable(),
  Religious_Order_Status_ID: z.number().int().nullable(),
  Incardination_Date: z.string().datetime().nullable(),
  Place_of_Incardination: z.string().max(100).nullable(),
  Profession_Of_Faith: z.boolean().nullable(),
  Letter_Of_Suitability: z.boolean().nullable(),
  Excardination_Date: z.string().datetime().nullable(),
  Place_of_Excardination: z.string().max(100).nullable(),
  Date_of_Arrival: z.string().datetime().nullable(),
  Date_of_Departure: z.string().datetime().nullable(),
  Comments: z.string().max(2147483647).nullable(),
  Date_of_Deacon_Ordination: z.string().datetime().nullable(),
  Priesthood_Date_of_Ordination: z.string().datetime().nullable(),
  Priesthood_Ordained_Here: z.number().int().nullable(),
  Priesthood_Ordained_By: z.string().max(100).nullable(),
  Date_of_First_Profession: z.string().datetime().nullable(),
  Date_of_Profession: z.string().datetime().nullable(),
});

export type PersonnelOrdinationInput = z.infer<typeof PersonnelOrdinationSchema>;
