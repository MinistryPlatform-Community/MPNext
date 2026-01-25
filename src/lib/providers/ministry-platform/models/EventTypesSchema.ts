import { z } from 'zod';

export const EventTypesSchema = z.object({
  Event_Type_ID: z.number().int(),
  Event_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Color: z.string().max(25).nullable(),
  Show_On_MPMobile: z.boolean(),
  Omit_From_Engagement_Attendance: z.boolean(),
  Auto_Close_Registrations: z.boolean(),
});

export type EventTypesInput = z.infer<typeof EventTypesSchema>;
