import { z } from 'zod';

export const DpBookmarksSchema = z.object({
  Bookmark_ID: z.number().int(),
  Name: z.string().max(100),
  URL: z.string().url().nullable(),
  ViewOrder: z.number().int(),
});

export type DpBookmarksInput = z.infer<typeof DpBookmarksSchema>;
