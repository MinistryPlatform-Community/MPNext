/**
 * Interface for Personnel_Record_Statuses
* Table: Personnel_Record_Statuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelRecordStatuses {

  Personnel_Record_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Personnel_Record_Status: string /* max 50 chars */;
}

export type PersonnelRecordStatusesRecord = PersonnelRecordStatuses;
