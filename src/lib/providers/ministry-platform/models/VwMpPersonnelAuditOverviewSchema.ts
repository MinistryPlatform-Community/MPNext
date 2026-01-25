import { z } from 'zod';

export const VwMpPersonnelAuditOverviewSchema = z.object({
  Audit_Item_ID: z.number().int(),
  Table_Name: z.string().max(75),
  Record_ID: z.number().int(),
  Personnel_ID: z.number().int(),
  Description: z.string().max(50),
  User: z.string().max(254),
  Date: z.string().datetime(),
  On_Behalf_Of: z.string().max(256),
  Impersonated_By: z.string().max(256),
  Field: z.string().max(50).nullable(),
  Previous: z.string().max(2147483647),
  New: z.string().max(2147483647),
});

export type VwMpPersonnelAuditOverviewInput = z.infer<typeof VwMpPersonnelAuditOverviewSchema>;
