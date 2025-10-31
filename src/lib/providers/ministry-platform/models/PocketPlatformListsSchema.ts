import { z } from 'zod';

export const PocketPlatformListsSchema = z.object({
  List_ID: z.number().int(),
  Parent_List_ID: z.number().int().nullable(),
  Title: z.string().max(255),
  Display_Title: z.string().max(255).nullable(),
  Subtitle: z.string().max(255).nullable(),
  Description: z.string().max(1000).nullable(),
  Link_URL: z.string().max(2000).nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Position: z.number().int().nullable(),
  Screen_ID: z.number().int().nullable(),
  Imported_ID: z.string().max(1000).nullable(),
  Congregation_ID: z.number().int().nullable(),
});

export type PocketPlatformListsInput = z.infer<typeof PocketPlatformListsSchema>;
