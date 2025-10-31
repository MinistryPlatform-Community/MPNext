import { z } from 'zod';

export const PcoconnectServiceTypesSchema = z.object({
  PCOConnect_Service_Type_ID: z.number().int(),
  Service_Type_ID: z.number().int().nullable(),
  Service_Type_Name: z.string().max(150).nullable(),
  Folder_Path_To_Root: z.string().max(255).nullable(),
  Program_ID: z.number().int().nullable(),
  Status: z.string().max(50).nullable(),
  Date_Created: z.string().datetime().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Date_Refreshed: z.string().datetime().nullable(),
  Date_Archived: z.string().datetime().nullable(),
  Org_Num: z.number().int().nullable(),
});

export type PcoconnectServiceTypesInput = z.infer<typeof PcoconnectServiceTypesSchema>;
