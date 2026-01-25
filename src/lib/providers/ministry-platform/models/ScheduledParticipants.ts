/**
 * Interface for Scheduled_Participants
* Table: Scheduled_Participants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ScheduledParticipants {

  Schedule_Participant_ID: number /* 32-bit integer */; // Primary Key

  Schedule_Role_ID: number /* 32-bit integer */; // Foreign Key -> Schedule_Roles.Schedule_Role_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Accepted?: boolean | null;

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;

  Declined_and_Hidden: boolean; // Has Default

  _Scheduled_Participant_GUID: string /* GUID/UUID */; // Read Only, Has Default
}

export type ScheduledParticipantsRecord = ScheduledParticipants;
