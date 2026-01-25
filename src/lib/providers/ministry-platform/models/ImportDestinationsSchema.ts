import { z } from 'zod';

export const ImportDestinationsSchema = z.object({
  Import_Destination_ID: z.number().int(),
  Table_Name: z.string().max(255),
});

export type ImportDestinationsInput = z.infer<typeof ImportDestinationsSchema>;
