/**
 * Interface for Event_Participants
* Table: Event_Participants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface EventParticipants {

  Event_Participant_ID: number /* 32-bit integer */; // Primary Key

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Participation_Status_ID: number /* 32-bit integer */; // Foreign Key -> Participation_Statuses.Participation_Status_ID

  Time_In?: string /* ISO datetime */ | null;

  Time_Confirmed?: string /* ISO datetime */ | null;

  Time_Out?: string /* ISO datetime */ | null;

  /**
   * Max length: 4000 characters
   */
  Notes?: string /* max 4000 chars */ | null;

  Group_Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Group_Participants.Group_Participant_ID

  /**
   * Max length: 50 characters
   */
  "Check-in_Station"?: string /* max 50 chars */ | null;

  _Setup_Date?: string /* ISO datetime */ | null; // Read Only, Has Default

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Room_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Rooms.Room_ID

  Call_Parents?: boolean | null;

  Group_Role_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Group_Roles.Group_Role_ID

  Response_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Responses.Response_ID

  Registrant_Message_Sent: boolean; // Has Default

  Attendee_Message_Sent: boolean; // Has Default

  Attending_Online: boolean; // Has Default

  RSVP_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> RSVP_Statuses.RSVP_Status_ID
}

export type EventParticipantsRecord = EventParticipants;
