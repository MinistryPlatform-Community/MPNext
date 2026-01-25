import { z } from 'zod';

export const PersonnelAssignmentsSchema = z.object({
  Personnel_Assignment_ID: z.number().int(),
  Personnel_ID: z.number().int(),
  Personnel_Assignment_Type_ID: z.number().int(),
  Location_ID: z.number().int().nullable(),
  Assignment_Role_ID: z.number().int().nullable(),
  Assignment_Start: z.string().datetime().nullable(),
  Assignment_End: z.string().datetime().nullable(),
  Primary_Assignment: z.boolean(),
  Assignment_Comments: z.string().max(2000).nullable(),
  Mail_To_Location: z.boolean().nullable(),
  Contract_Signed: z.boolean().nullable(),
  Hours_Per_Week: z.number().int().nullable(),
  Hourly_Rate: z.number().nullable(),
  Annual_Salary: z.number().nullable(),
  Vacation_Hours: z.number().int().nullable(),
});

export type PersonnelAssignmentsInput = z.infer<typeof PersonnelAssignmentsSchema>;
