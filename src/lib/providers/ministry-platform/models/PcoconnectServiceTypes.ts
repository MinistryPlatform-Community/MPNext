/**
 * Interface for PCOConnect_Service_Types
* Table: PCOConnect_Service_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectServiceTypes {

  PCOConnect_Service_Type_ID: number /* 32-bit integer */; // Primary Key

  Service_Type_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 150 characters
   */
  Service_Type_Name?: string /* max 150 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Folder_Path_To_Root?: string /* max 255 chars */ | null;

  Program_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Programs.Program_ID

  /**
   * Max length: 50 characters
   */
  Status?: string /* max 50 chars */ | null;

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  Date_Archived?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;
}

export type PcoconnectServiceTypesRecord = PcoconnectServiceTypes;
