import { z } from 'zod';

export const DpUserChartsSchema = z.object({
  User_Chart_ID: z.number().int(),
  Chart_ID: z.number().int(),
  User_ID: z.number().int(),
  Chart_Type_ID: z.number().int(),
  Position: z.number().int(),
});

export type DpUserChartsInput = z.infer<typeof DpUserChartsSchema>;
