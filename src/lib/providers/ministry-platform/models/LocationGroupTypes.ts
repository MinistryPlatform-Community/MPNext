/**
 * Interface for Location_Group_Types
* Table: Location_Group_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface LocationGroupTypes {

  Location_Group_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Location_Group_Type?: string /* max 50 chars */ | null;
}

export type LocationGroupTypesRecord = LocationGroupTypes;
