/**
 * Interface for Group_Slot_Participants
* Table: Group_Slot_Participants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupSlotParticipants {

  Group_Slot_Participant_ID: number /* 32-bit integer */; // Primary Key

  Group_Slot_ID: number /* 32-bit integer */; // Foreign Key -> Group_Slots.Group_Slot_ID

  Group_Participant_ID: number /* 32-bit integer */; // Foreign Key -> Group_Participants.Group_Participant_ID

  Date: string /* ISO datetime */;

  Slot_Participation_Status_ID: number /* 32-bit integer */; // Foreign Key -> Slot_Participation_Statuses.Slot_Participation_Status_ID, Has Default
}

export type GroupSlotParticipantsRecord = GroupSlotParticipants;
