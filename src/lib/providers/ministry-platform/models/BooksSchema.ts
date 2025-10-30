import { z } from 'zod';

export const BooksSchema = z.object({
  Book_ID: z.number().int(),
  Title: z.string().max(150),
  ISBN: z.string().max(15).nullable(),
  Description: z.string().max(255).nullable(),
  Cost: z.number().nullable(),
  Start_Date: z.string().datetime().nullable(),
  Genre_ID: z.number().int().nullable(),
});

export type BooksInput = z.infer<typeof BooksSchema>;
