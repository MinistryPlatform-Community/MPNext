import { z } from 'zod';

export const DpApplicationLabelsSchema = z.object({
  Application_Label_ID: z.number().int(),
  API_Client_ID: z.number().int(),
  Label_Name: z.string().max(128),
  English: z.string().max(255),
  Spanish: z.string().max(255).nullable(),
  Chinese: z.string().max(255).nullable(),
  Portuguese: z.string().max(255).nullable(),
});

export type DpApplicationLabelsInput = z.infer<typeof DpApplicationLabelsSchema>;
