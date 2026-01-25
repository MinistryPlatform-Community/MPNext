import { z } from 'zod';

export const ServicingSchema = z.object({
  Service_ID: z.number().int(),
  Service_Name: z.string().max(50),
  Service_Type_ID: z.number().int().nullable(),
  Unit: z.string().max(50).nullable(),
  Price: z.number().nullable(),
  Description: z.string().max(255).nullable(),
  Team_Group_ID: z.number().int().nullable(),
  Contact_ID: z.number().int().nullable(),
  Standard_Service: z.boolean(),
  Auto_Approve: z.boolean(),
  Days_To_Remind: z.number().int().nullable(),
});

export type ServicingInput = z.infer<typeof ServicingSchema>;
