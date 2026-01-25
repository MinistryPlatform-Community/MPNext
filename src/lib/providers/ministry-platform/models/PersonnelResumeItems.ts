/**
 * Interface for Personnel_Resume_Items
* Table: Personnel_Resume_Items
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelResumeItems {

  Personnel_Resume_Item_ID: number /* 32-bit integer */; // Primary Key

  Personnel_ID: number /* 32-bit integer */; // Foreign Key -> Personnel.Personnel_ID

  /**
   * Max length: 249 characters
   */
  Resume_Item: string /* max 249 chars */;

  Resume_Item_Type_ID: number /* 32-bit integer */; // Foreign Key -> Personnel_Resume_Item_Types.Resume_Item_Type_ID

  /**
   * Max length: 2000 characters
   */
  Resume_Item_Notes?: string /* max 2000 chars */ | null;

  Date_Started?: string /* ISO datetime */ | null;

  Date_Achieved?: string /* ISO datetime */ | null;

  Date_Expires?: string /* ISO datetime */ | null;

  Location_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Locations.Location_ID

  /**
   * Max length: 500 characters
   */
  Place?: string /* max 500 chars */ | null;
}

export type PersonnelResumeItemsRecord = PersonnelResumeItems;
