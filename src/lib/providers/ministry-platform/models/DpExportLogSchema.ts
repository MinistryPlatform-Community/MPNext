import { z } from 'zod';

export const DpExportLogSchema = z.object({
  Export_ID: z.number().int(),
  Date_Time: z.string().datetime(),
  User_Name: z.string().max(256).nullable(),
  User_ID: z.number().int(),
  Table_Name: z.unknown(),
  View_Title: z.string().max(255).nullable(),
  Record_Count: z.number().int(),
});

export type DpExportLogInput = z.infer<typeof DpExportLogSchema>;
