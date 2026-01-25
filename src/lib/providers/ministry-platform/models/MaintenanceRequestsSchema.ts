import { z } from 'zod';

export const MaintenanceRequestsSchema = z.object({
  Maintenance_Request_ID: z.number().int(),
  Submitted_For: z.number().int(),
  Request_Date: z.string().datetime(),
  Request_Title: z.string().max(50),
  Description: z.string().max(4000).nullable(),
  Notes: z.string().max(4000).nullable(),
  _Completed: z.boolean().nullable(),
});

export type MaintenanceRequestsInput = z.infer<typeof MaintenanceRequestsSchema>;
