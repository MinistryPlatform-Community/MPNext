import { z } from 'zod';

export const ProceduresSchema = z.object({
  Procedure_ID: z.number().int(),
  Procedure_Title: z.string().max(50),
  Creation_Date: z.string().datetime().nullable(),
  Active: z.boolean(),
  User_ID: z.number().int(),
  Ministry_ID: z.number().int().nullable(),
  Page_ID: z.number().int().nullable(),
  Purpose: z.string().max(1000).nullable(),
  Approach: z.string().max(1000).nullable(),
  Step_by_Step: z.string().max(2147483647).nullable(),
});

export type ProceduresInput = z.infer<typeof ProceduresSchema>;
