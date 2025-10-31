import { z } from 'zod';

export const PcoconnectCampusesSchema = z.object({
  PCOConnect_Campus_ID: z.number().int(),
  Campus_ID: z.number().int().nullable(),
  Campus_Name: z.string().max(150).nullable(),
  Congregation_ID: z.number().int().nullable(),
  Date_Created: z.string().datetime().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Date_Refreshed: z.string().datetime().nullable(),
  Org_Num: z.number().int().nullable(),
});

export type PcoconnectCampusesInput = z.infer<typeof PcoconnectCampusesSchema>;
