import { z } from 'zod';

export const GenresSchema = z.object({
  Genre_ID: z.number().int(),
  Genre: z.string().max(50),
});

export type GenresInput = z.infer<typeof GenresSchema>;
