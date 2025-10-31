import { z } from 'zod';

export const ChurchOnlineWatchTypesSchema = z.object({
  Church_Online_Watch_Type_ID: z.number().int(),
  Watch_Type: z.string().max(50),
  Description: z.string().max(150).nullable(),
});

export type ChurchOnlineWatchTypesInput = z.infer<typeof ChurchOnlineWatchTypesSchema>;
