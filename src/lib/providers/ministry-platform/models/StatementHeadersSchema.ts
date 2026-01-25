import { z } from 'zod';

export const StatementHeadersSchema = z.object({
  Statement_Header_ID: z.number().int(),
  Statement_Header: z.string().max(50),
  Header_Sort: z.unknown(),
});

export type StatementHeadersInput = z.infer<typeof StatementHeadersSchema>;
