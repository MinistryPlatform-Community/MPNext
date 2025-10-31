/**
 * Interface for Pocket_Platform_Service_Types
* Table: Pocket_Platform_Service_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PocketPlatformServiceTypes {

  Service_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Service_Type: string /* max 50 chars */;
}

export type PocketPlatformServiceTypesRecord = PocketPlatformServiceTypes;
