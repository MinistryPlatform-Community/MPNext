/**
 * Interface for Personnel
* Table: Personnel
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Personnel {

  Personnel_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Personnel_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Personnel_Types.Personnel_Type_ID

  Start_Date?: string /* ISO datetime */ | null;

  End_Date?: string /* ISO datetime */ | null;

  Personnel_Record_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Personnel_Record_Statuses.Personnel_Record_Status_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 2000 characters
   */
  Personnel_Notes?: string /* max 2000 chars */ | null;

  Hire_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 50 characters
   */
  ID_Number?: string /* max 50 chars */ | null;

  Citizenship_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Citizenship_Types.Citizenship_Type_ID

  /**
   * Max length: 249 characters
   */
  Citizen_Of?: string /* max 249 chars */ | null;

  Document_Expiration?: string /* ISO date (YYYY-MM-DD) */ | null;

  Passport_On_File?: boolean | null; // Has Default

  Passport_Expiration?: string /* ISO datetime */ | null;

  Form_I9?: boolean | null; // Has Default

  Eligible_For_Benefits?: boolean | null; // Has Default

  Deferred_or_Vested?: boolean | null; // Has Default

  Physician_On_File?: boolean | null; // Has Default

  Termination_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 249 characters
   */
  Termination_Reason?: string /* max 249 chars */ | null;

  Date_Retired?: string /* ISO date (YYYY-MM-DD) */ | null;

  Personnel_Category_ID: number /* 32-bit integer */; // Foreign Key -> Personnel_Categories.Personnel_Category_ID
}

export type PersonnelRecord = Personnel;
