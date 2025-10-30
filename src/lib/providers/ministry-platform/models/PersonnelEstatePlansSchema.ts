import { z } from 'zod';

export const PersonnelEstatePlansSchema = z.object({
  Personnel_Estate_Plan_ID: z.number().int(),
  Personnel_ID: z.number().int(),
  Living_Will_Last_Updated: z.string().datetime().nullable(),
  Living_Will_Filed_At: z.string().max(100).nullable(),
  Living_Will_Surrogate_Name: z.string().max(150).nullable(),
  Living_Will_Relationship: z.string().max(150).nullable(),
  Living_Will_Address: z.string().max(500).nullable(),
  Living_Will_Phones: z.string().max(100).nullable(),
  Living_Will_Advance_Health_Directive: z.boolean().nullable(),
  Power_of_Attorney_Filed_At: z.string().max(100).nullable(),
  Power_of_Attorney_Date_Completed: z.string().datetime().nullable(),
  Power_of_Attorney_Copy_to_PCP: z.boolean().nullable(),
  Power_of_Attorney_Agent_Has_Copy: z.boolean().nullable(),
  Will_Last_Updated_Date: z.string().datetime().nullable(),
  Will_Filed_At: z.string().max(100).nullable(),
  Will_Executor_Name: z.string().max(150).nullable(),
  Will_Address: z.string().max(500).nullable(),
  Will_Phones: z.string().max(100).nullable(),
  Funeral_Filed_At: z.string().max(100).nullable(),
  Funeral_Service_Location: z.string().max(150).nullable(),
  Funeral_Presider: z.string().max(150).nullable(),
  Funeral_Homilist: z.string().max(150).nullable(),
  Funeral_Place_of_Interment: z.string().max(500).nullable(),
  Beneficiary_On_File: z.boolean().nullable(),
  Beneficiary_Notes: z.string().max(2000).nullable(),
});

export type PersonnelEstatePlansInput = z.infer<typeof PersonnelEstatePlansSchema>;
