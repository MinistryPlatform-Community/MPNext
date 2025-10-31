import { z } from 'zod';

export const PocketPlatformSermonLinkTypesSchema = z.object({
  Sermon_Link_Type_ID: z.number().int(),
  Sermon_Link_Type: z.string().max(50),
  Icon_ID: z.number().int(),
  Media_Type_ID: z.number().int().nullable(),
  Show_On_Widget_Listen_Menu: z.boolean(),
  Priority: z.number().int().nullable(),
  Show_On_Widget: z.boolean(),
  Show_On_Widget_Series_List: z.boolean(),
  Use_As_Trailer: z.boolean(),
});

export type PocketPlatformSermonLinkTypesInput = z.infer<typeof PocketPlatformSermonLinkTypesSchema>;
