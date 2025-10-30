import { z } from 'zod';

export const ParticipantEngagementSchema = z.object({
  Participant_Engagement_ID: z.number().int(),
  Engagement_Level: z.string().max(50),
  Engagement_Level_Rules: z.string().max(500).nullable(),
});

export type ParticipantEngagementInput = z.infer<typeof ParticipantEngagementSchema>;
