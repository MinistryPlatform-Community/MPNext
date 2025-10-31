/**
 * Interface for Opportunity_Slot_Participants
* Table: Opportunity_Slot_Participants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface OpportunitySlotParticipants {

  Opportunity_Slot_Participant_ID: number /* 32-bit integer */; // Primary Key

  Opportunity_Slot_ID: number /* 32-bit integer */; // Foreign Key -> Opportunity_Slots.Opportunity_Slot_ID

  Response_ID: number /* 32-bit integer */; // Foreign Key -> Responses.Response_ID

  Date: string /* ISO datetime */;

  Slot_Participation_Status_ID: number /* 32-bit integer */; // Foreign Key -> Slot_Participation_Statuses.Slot_Participation_Status_ID, Has Default
}

export type OpportunitySlotParticipantsRecord = OpportunitySlotParticipants;
