import { z } from 'zod';

export const DpRecordSecuritySchema = z.object({
  Record_Security_ID: z.number().int(),
  Restricted: z.boolean(),
  Record_ID: z.number().int(),
  Table_Name: z.string().max(50),
});

export type DpRecordSecurityInput = z.infer<typeof DpRecordSecuritySchema>;
