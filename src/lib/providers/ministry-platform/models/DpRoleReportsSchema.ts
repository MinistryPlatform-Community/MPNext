import { z } from 'zod';

export const DpRoleReportsSchema = z.object({
  Role_Report_ID: z.number().int(),
  Role_ID: z.number().int(),
  Report_ID: z.number().int(),
});

export type DpRoleReportsInput = z.infer<typeof DpRoleReportsSchema>;
