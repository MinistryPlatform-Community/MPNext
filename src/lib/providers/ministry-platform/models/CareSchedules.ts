/**
 * Interface for Care_Schedules
* Table: Care_Schedules
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CareSchedules {

  Care_Schedule_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Schedule_Start: string /* ISO datetime */;

  Schedule_End: string /* ISO datetime */;

  Care_Schedule_Type_ID: number /* 32-bit integer */; // Foreign Key -> Care_Schedule_Types.Care_Schedule_Type_ID, Has Default

  /**
   * Max length: 500 characters
   */
  Schedule_Notes?: string /* max 500 chars */ | null;

  Location_ID: number /* 32-bit integer */; // Foreign Key -> Locations.Location_ID

  Cancelled: boolean; // Has Default
}

export type CareSchedulesRecord = CareSchedules;
