import { z } from 'zod';

export const ParticipantTypesSchema = z.object({
  Participant_Type_ID: z.number().int(),
  Participant_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Can_Access_Directory: z.boolean(),
  Show_In_Directory: z.boolean(),
  Send_Birthday_Email: z.boolean(),
  Auto_Inactivate: z.boolean(),
  Days_Without_Activity: z.number().int().nullable(),
  Set_Inactivated_To: z.number().int().nullable(),
  Publication_Unsubscribe: z.boolean().nullable(),
  Auto_Reactivate: z.boolean(),
  Days_Before_Reactivating: z.number().int().nullable(),
  Active_Days_Past_30_Days: z.number().int().nullable(),
  Set_Reactivated_To: z.number().int().nullable(),
  Reactivate_with_Family: z.boolean(),
});

export type ParticipantTypesInput = z.infer<typeof ParticipantTypesSchema>;
