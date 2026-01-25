import { z } from 'zod';

export const DpWebhooksSchema = z.object({
  Webhook_ID: z.number().int(),
  Display_Name: z.string().max(50),
  Description: z.string().max(1024).nullable(),
  Http_Method: z.string().max(10),
  Uri_Template: z.string().url().nullable(),
  Body_Template: z.string().max(4000).nullable(),
  Headers_Template: z.string().max(4000).nullable(),
  Trigger_Fields: z.string().max(255).nullable(),
  Dependent_Condition: z.string().max(4000).nullable(),
  Trigger_On_Create: z.boolean(),
  Trigger_On_Update: z.boolean(),
  Trigger_On_Delete: z.boolean(),
  Max_Retries: z.unknown(),
  Active: z.boolean(),
  Table_Name: z.unknown(),
  Trigger_On_File_Change: z.boolean(),
});

export type DpWebhooksInput = z.infer<typeof DpWebhooksSchema>;
