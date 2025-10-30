import { z } from 'zod';

export const DpAuditRetentionMessagesSchema = z.object({
  Audit_Retention_Message_ID: z.number().int(),
  _Audit_Retention_Policy_ID: z.number().int().nullable(),
  _Message_Code: z.number().int().nullable(),
  _Message_Time: z.string().datetime().nullable(),
  _Error_Severity: z.number().int().nullable(),
  _Message: z.string().max(2000).nullable(),
  _Message_Sql: z.string().max(1000).nullable(),
});

export type DpAuditRetentionMessagesInput = z.infer<typeof DpAuditRetentionMessagesSchema>;
