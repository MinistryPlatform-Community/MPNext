import { z } from 'zod';

export const AccountingCompaniesSchema = z.object({
  Accounting_Company_ID: z.number().int(),
  Company_Name: z.string().max(75),
  Company_Contact_ID: z.number().int().nullable(),
  Default_Congregation: z.number().int().nullable(),
  Show_Online: z.boolean(),
  Online_Sort_Order: z.number().int().nullable(),
  Pledge_Campaign_ID: z.number().int().nullable(),
  Alternate_Pledge_Campaign: z.number().int().nullable(),
  List_Non_Cash_Gifts: z.boolean(),
  Statement_Footer: z.string().max(500).nullable(),
  Statement_Letter: z.string().max(2147483647).nullable(),
  Statement_Cutoff_Date: z.string().datetime().nullable(),
  Statement_Cutoff_Automation_ID: z.number().int().nullable(),
  Standard_Statement: z.number().int().nullable(),
  Formal_Salutation: z.boolean(),
  Archive_Day_of_Year: z.number().int(),
  Rows_Per_Page: z.number().int(),
  Summary_Columns: z.number().int(),
  Immediate_Destination_ID: z.string().max(10).nullable(),
  Immediate_Origin_ID: z.string().max(10).nullable(),
  Immediate_Destination_Name: z.string().max(23).nullable(),
  Immediate_Origin_Name: z.string().max(23).nullable(),
  Immediate_Routing_Number: z.string().max(9).nullable(),
  Receiving_DFI_ID: z.string().max(9).nullable(),
  Current_Settings: z.boolean(),
  Include_Soft_Credits: z.boolean(),
});

export type AccountingCompaniesInput = z.infer<typeof AccountingCompaniesSchema>;
