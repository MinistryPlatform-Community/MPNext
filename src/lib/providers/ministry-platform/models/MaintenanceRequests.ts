/**
 * Interface for Maintenance_Requests
* Table: Maintenance_Requests
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface MaintenanceRequests {

  Maintenance_Request_ID: number /* 32-bit integer */; // Primary Key

  Submitted_For: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Request_Date: string /* ISO datetime */;

  /**
   * Max length: 50 characters
   */
  Request_Title: string /* max 50 chars */;

  /**
   * Max length: 4000 characters
   */
  Description?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Notes?: string /* max 4000 chars */ | null;

  _Completed?: boolean | null; // Read Only
}

export type MaintenanceRequestsRecord = MaintenanceRequests;
