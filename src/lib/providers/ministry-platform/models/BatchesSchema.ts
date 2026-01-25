import { z } from 'zod';

export const BatchesSchema = z.object({
  Batch_ID: z.number().int(),
  Batch_Name: z.string().max(75),
  Setup_Date: z.string().datetime(),
  Batch_Total: z.number(),
  Item_Count: z.number().int(),
  Batch_Entry_Type_ID: z.number().int(),
  Batch_Type_ID: z.number().int().nullable(),
  Default_Program: z.number().int().nullable(),
  Source_Event: z.number().int().nullable(),
  Deposit_ID: z.number().int().nullable(),
  Finalize_Date: z.string().datetime().nullable(),
  Congregation_ID: z.number().int().nullable(),
  _Import_Counter: z.number().int().nullable(),
  _Source_File: z.string().max(50).nullable(),
  Default_Payment_Type: z.number().int().nullable(),
  Currency: z.string().max(25).nullable(),
  Operator_User: z.number().int().nullable(),
  Default_Program_ID_List: z.string().max(64).nullable(),
  Expected_Total_Pledge_Amount: z.number().nullable(),
  Expected_Number_of_Pledges: z.number().int().nullable(),
  Batch_Usage_Type_ID: z.number().int(),
  Pledge_Campaign_ID: z.number().int().nullable(),
});

export type BatchesInput = z.infer<typeof BatchesSchema>;
