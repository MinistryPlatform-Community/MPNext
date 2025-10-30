import { z } from 'zod';

export const BackgroundCheckTypesSchema = z.object({
  Background_Check_Type_ID: z.number().int(),
  Background_Check_Type: z.string().max(128),
  Description: z.string().max(256).nullable(),
  Service_Code: z.string().max(50).nullable(),
  Package_Service_Code: z.string().max(50).nullable(),
  Collect_DL: z.boolean(),
  Service_Code_Delayed: z.string().max(50).nullable(),
  Collect_State: z.boolean(),
  Collect_Jurisdiction: z.boolean(),
  Collect_Ethnicity: z.boolean(),
  Default_Package: z.boolean(),
  Detect_County: z.boolean(),
  Drug_Test: z.boolean(),
  Is_Background_Check: z.boolean(),
  Credit_Check: z.boolean(),
  Months_Till_Expires: z.number().int().nullable(),
  Expiring_Soon_Days: z.number().int().nullable(),
  Type_Needs_Review: z.boolean(),
  Enabled: z.boolean(),
});

export type BackgroundCheckTypesInput = z.infer<typeof BackgroundCheckTypesSchema>;
