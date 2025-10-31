import { z } from 'zod';

export const PcoconnectPlansSchema = z.object({
  PCOConnect_Plan_ID: z.number().int(),
  Plan_ID: z.number().int().nullable(),
  Plan_Title: z.string().max(255).nullable(),
  Series_Title: z.string().max(255).nullable(),
  Plan_Date: z.string().datetime().nullable(),
  PCOConnect_Service_Type_ID: z.number().int().nullable(),
  Status: z.string().max(50).nullable(),
  Date_Created: z.string().datetime().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Date_Refreshed: z.string().datetime().nullable(),
  Org_Num: z.number().int().nullable(),
});

export type PcoconnectPlansInput = z.infer<typeof PcoconnectPlansSchema>;
