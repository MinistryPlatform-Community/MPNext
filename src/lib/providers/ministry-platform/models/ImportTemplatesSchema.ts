import { z } from 'zod';

export const ImportTemplatesSchema = z.object({
  Import_Template_ID: z.number().int(),
  Import_Destination_ID: z.number().int(),
  Congregation_ID: z.number().int().nullable(),
  Import_Template_Name: z.string().max(50),
  _Template: z.string().max(2147483647),
});

export type ImportTemplatesInput = z.infer<typeof ImportTemplatesSchema>;
