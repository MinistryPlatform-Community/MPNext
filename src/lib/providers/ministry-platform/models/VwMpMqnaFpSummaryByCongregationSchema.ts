import { z } from 'zod';

export const VwMpMqnaFpSummaryByCongregationSchema = z.object({
  Period_Congregation_ID: z.number().int().nullable(),
  Years_Since: z.string().max(4000),
  Fiscal_Year_Start: z.string().datetime(),
  Periods_Since: z.string().max(4000),
  Fiscal_Period_Start: z.string().datetime(),
  Fiscal_Period_Month: z.number().int().nullable(),
  Congregation_Name: z.string().max(50),
  ChurchPlant$: z.string().max(4000).nullable(),
  Gen_Fund_Plate: z.string().max(4000).nullable(),
  Gen_Fund_Online: z.string().max(4000).nullable(),
  DesignatedPlate: z.string().max(4000).nullable(),
  DesignateOnline: z.string().max(4000).nullable(),
  Adults_9am: z.string().max(4000).nullable(),
  Adults_11am: z.string().max(4000).nullable(),
  Children_9am: z.string().max(4000).nullable(),
  Children_11am: z.string().max(4000).nullable(),
  NextGenVol_9am: z.string().max(4000).nullable(),
  NextGenVol_11am: z.string().max(4000).nullable(),
  Replay: z.string().max(4000).nullable(),
  Congregation_ID: z.number().int().nullable(),
});

export type VwMpMqnaFpSummaryByCongregationInput = z.infer<typeof VwMpMqnaFpSummaryByCongregationSchema>;
