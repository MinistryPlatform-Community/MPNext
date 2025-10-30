/**
 * Interface for Personnel_Resume_Item_Types
* Table: Personnel_Resume_Item_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelResumeItemTypes {

  Resume_Item_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Resume_Item_Type?: string /* max 50 chars */ | null;
}

export type PersonnelResumeItemTypesRecord = PersonnelResumeItemTypes;
