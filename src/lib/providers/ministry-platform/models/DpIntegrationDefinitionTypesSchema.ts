import { z } from 'zod';

export const DpIntegrationDefinitionTypesSchema = z.object({
  Integration_Definition_Type_ID: z.number().int(),
  Display_Name: z.string().max(50),
});

export type DpIntegrationDefinitionTypesInput = z.infer<typeof DpIntegrationDefinitionTypesSchema>;
