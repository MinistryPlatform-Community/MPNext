import { z } from 'zod';

export const StaffSchema = z.object({
  Staff_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Job_Title: z.string().max(100).nullable(),
  Phone_Number: z.string().max(100).nullable(),
  Photo_URL: z.string().max(255).nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Bio: z.string().max(2147483647).nullable(),
  Primary_Ministry: z.number().int(),
  Primary_Congregation: z.number().int(),
  New_Hire_Evalutation_Complete: z.boolean(),
  Declined_401K: z.boolean(),
  ACS_Vendor_ID: z.number().int().nullable(),
  _Months_of_Service: z.number().int().nullable(),
  _Completed_Years_of_Service: z.number().int().nullable(),
  Years_of_Service_Modifier: z.number().int(),
  Impersonate_All_Time_Off: z.boolean(),
});

export type StaffInput = z.infer<typeof StaffSchema>;
