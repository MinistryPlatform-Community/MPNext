import { z } from 'zod';

export const EventParticipantsSchema = z.object({
  Event_Participant_ID: z.number().int(),
  Event_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Participation_Status_ID: z.number().int(),
  Time_In: z.string().datetime().nullable(),
  Time_Confirmed: z.string().datetime().nullable(),
  Time_Out: z.string().datetime().nullable(),
  Notes: z.string().max(4000).nullable(),
  Group_Participant_ID: z.number().int().nullable(),
  "Check-in_Station": z.string().max(50).nullable(),
  _Setup_Date: z.string().datetime().nullable(),
  Group_ID: z.number().int().nullable(),
  Room_ID: z.number().int().nullable(),
  Call_Parents: z.boolean().nullable(),
  Group_Role_ID: z.number().int().nullable(),
  Response_ID: z.number().int().nullable(),
  Registrant_Message_Sent: z.boolean(),
  Attendee_Message_Sent: z.boolean(),
  Attending_Online: z.boolean(),
  RSVP_Status_ID: z.number().int().nullable(),
});

export type EventParticipantsInput = z.infer<typeof EventParticipantsSchema>;
