import { z } from 'zod';

export const PocketPlatformGroupMessagesGroupsSchema = z.object({
  Messaging_Group_ID: z.number().int(),
  Group_ID: z.number().int(),
  Last_Message_ID: z.number().int().nullable(),
  Group_Enabled: z.boolean(),
  Last_Message_Date: z.string().datetime().nullable(),
});

export type PocketPlatformGroupMessagesGroupsInput = z.infer<typeof PocketPlatformGroupMessagesGroupsSchema>;
