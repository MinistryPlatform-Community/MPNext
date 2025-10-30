import { z } from 'zod';

export const PersonnelSchema = z.object({
  Personnel_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Personnel_Type_ID: z.number().int().nullable(),
  Start_Date: z.string().datetime().nullable(),
  End_Date: z.string().datetime().nullable(),
  Personnel_Record_Status_ID: z.number().int().nullable(),
  Congregation_ID: z.number().int().nullable(),
  Personnel_Notes: z.string().max(2000).nullable(),
  Hire_Date: z.string().datetime().nullable(),
  ID_Number: z.string().max(50).nullable(),
  Citizenship_Type_ID: z.number().int().nullable(),
  Citizen_Of: z.string().max(249).nullable(),
  Document_Expiration: z.string().datetime().nullable(),
  Passport_On_File: z.boolean().nullable(),
  Passport_Expiration: z.string().datetime().nullable(),
  Form_I9: z.boolean().nullable(),
  Eligible_For_Benefits: z.boolean().nullable(),
  Deferred_or_Vested: z.boolean().nullable(),
  Physician_On_File: z.boolean().nullable(),
  Termination_Date: z.string().datetime().nullable(),
  Termination_Reason: z.string().max(249).nullable(),
  Date_Retired: z.string().datetime().nullable(),
  Personnel_Category_ID: z.number().int(),
});

export type PersonnelInput = z.infer<typeof PersonnelSchema>;
