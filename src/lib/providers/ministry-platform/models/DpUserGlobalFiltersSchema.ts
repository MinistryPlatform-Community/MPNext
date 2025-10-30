import { z } from 'zod';

export const DpUserGlobalFiltersSchema = z.object({
  dp_User_Global_Filter_ID: z.number().int(),
  User_ID: z.number().int(),
  Global_Filter_ID: z.unknown(),
});

export type DpUserGlobalFiltersInput = z.infer<typeof DpUserGlobalFiltersSchema>;
