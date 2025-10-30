import { z } from 'zod';

export const DpWebhookInvocationsSchema = z.object({
  Webhook_Invocation_ID: z.number().int(),
  Webhook_ID: z.number().int(),
  Record_ID: z.number().int(),
  Created: z.string().datetime(),
  Updated: z.string().datetime().nullable(),
  Status_ID: z.number().int(),
  Retries_Left: z.unknown(),
  Uri: z.string().url().nullable(),
  Body: z.string().max(4000).nullable(),
  Headers: z.string().max(4000).nullable(),
  Response: z.string().max(2147483647).nullable(),
  Task_ID: z.number().int().nullable(),
});

export type DpWebhookInvocationsInput = z.infer<typeof DpWebhookInvocationsSchema>;
