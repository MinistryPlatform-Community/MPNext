import { z } from 'zod';

export const DpConfigurationListsSchema = z.object({
  Configuration_List_ID: z.number().int(),
  Application_Code: z.string().max(50),
  List_Name: z.string().max(128),
  Key_Name: z.string().max(128),
  Value: z.string().max(4000).nullable(),
  _Warning: z.string().max(250),
});

export type DpConfigurationListsInput = z.infer<typeof DpConfigurationListsSchema>;
