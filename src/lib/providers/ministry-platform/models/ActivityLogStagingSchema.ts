import { z } from 'zod';

export const ActivityLogStagingSchema = z.object({
  Activity_Log_Staging_ID: z.number().int(),
  Page_ID: z.number().int(),
  Last_PK: z.number().int(),
  Last_Date: z.string().datetime(),
});

export type ActivityLogStagingInput = z.infer<typeof ActivityLogStagingSchema>;
