import { z } from 'zod';

export const ChurchOnlineMetricsSchema = z.object({
  Church_Online_Metric_ID: z.number().int(),
  Event_Title: z.string().max(150).nullable(),
  Date: z.string().datetime().nullable(),
  Watch_Type: z.number().int().nullable(),
  City: z.string().max(150).nullable(),
  State: z.string().max(100).nullable(),
  Country: z.string().max(2).nullable(),
  User_Agent_String: z.string().max(300).nullable(),
  Watch_Time: z.number().int().nullable(),
  Latitude: z.number().nullable(),
  Longitude: z.number().nullable(),
  Closest_Congregation: z.number().int().nullable(),
  Distance_To_Closest_Congregation: z.number().nullable(),
  IP_Address: z.string().max(15).nullable(),
});

export type ChurchOnlineMetricsInput = z.infer<typeof ChurchOnlineMetricsSchema>;
