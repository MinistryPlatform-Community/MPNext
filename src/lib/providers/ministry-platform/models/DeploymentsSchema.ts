import { z } from 'zod';

export const DeploymentsSchema = z.object({
  Deployment_ID: z.number().int(),
  Deployment_Date: z.string().datetime(),
  Application_Code: z.string().max(16),
  Build_Version: z.string().max(16),
  Notes: z.string().max(255).nullable(),
});

export type DeploymentsInput = z.infer<typeof DeploymentsSchema>;
