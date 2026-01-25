/**
 * Interface for Need_Types
* Table: Need_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface NeedTypes {

  Need_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Need_Type: string /* max 50 chars */;

  Need_Campaign_ID: number /* 32-bit integer */; // Foreign Key -> Need_Campaigns.Need_Campaign_ID
}

export type NeedTypesRecord = NeedTypes;
