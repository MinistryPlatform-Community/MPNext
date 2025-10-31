/**
 * Interface for Slot_Participation_Statuses
* Table: Slot_Participation_Statuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface SlotParticipationStatuses {

  Slot_Participation_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Slot_Participation_Status: string /* max 50 chars */;
}

export type SlotParticipationStatusesRecord = SlotParticipationStatuses;
