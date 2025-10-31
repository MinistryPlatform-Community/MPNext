import { z } from 'zod';

export const PurchaseRequestsSchema = z.object({
  Purchase_Request_ID: z.number().int(),
  Submitted_By: z.number().int(),
  Ministry_ID: z.number().int(),
  Item_Name: z.string().max(50),
  Description: z.string().max(4000).nullable(),
  Priority_Level: z.number().int(),
  Amount_Needed: z.number(),
  Date_Submitted: z.string().datetime(),
  Date_Needed: z.string().datetime().nullable(),
  Department_Number: z.number().int().nullable(),
  Account_Number: z.number().int().nullable(),
  Approval_Note: z.string().max(500).nullable(),
  Closed: z.boolean(),
  _Approved: z.boolean().nullable(),
});

export type PurchaseRequestsInput = z.infer<typeof PurchaseRequestsSchema>;
