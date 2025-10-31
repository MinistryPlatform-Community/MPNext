/**
 * Interface for Staff_Timeaway_Request_Statuses
* Table: Staff_Timeaway_Request_Statuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StaffTimeawayRequestStatuses {

  Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Status?: string /* max 50 chars */ | null;

  Notify_Employee: boolean; // Has Default

  Notify_Superivsor: boolean; // Has Default

  Notify_HR?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Communication_Template_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID
}

export type StaffTimeawayRequestStatusesRecord = StaffTimeawayRequestStatuses;
