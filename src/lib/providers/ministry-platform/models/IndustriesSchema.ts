import { z } from 'zod';

export const IndustriesSchema = z.object({
  Industry_ID: z.number().int(),
  Industry_Title: z.string().max(255),
});

export type IndustriesInput = z.infer<typeof IndustriesSchema>;
