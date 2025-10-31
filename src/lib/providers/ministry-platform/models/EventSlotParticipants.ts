/**
 * Interface for Event_Slot_Participants
* Table: Event_Slot_Participants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface EventSlotParticipants {

  Event_Slot_Participant_ID: number /* 32-bit integer */; // Primary Key

  Event_Slot_ID: number /* 32-bit integer */; // Foreign Key -> Event_Slots.Event_Slot_ID

  Event_Participant_ID: number /* 32-bit integer */; // Foreign Key -> Event_Participants.Event_Participant_ID

  Date: string /* ISO datetime */;

  Slot_Participation_Status_ID: number /* 32-bit integer */; // Foreign Key -> Slot_Participation_Statuses.Slot_Participation_Status_ID, Has Default
}

export type EventSlotParticipantsRecord = EventSlotParticipants;
