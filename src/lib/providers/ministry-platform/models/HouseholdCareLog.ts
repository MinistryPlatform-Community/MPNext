/**
 * Interface for Household_Care_Log
* Table: Household_Care_Log
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface HouseholdCareLog {

  Household_Care_ID: number /* 32-bit integer */; // Primary Key

  Household_ID: number /* 32-bit integer */; // Foreign Key -> Households.Household_ID

  Care_Type_ID: number /* 32-bit integer */; // Foreign Key -> Care_Types.Care_Type_ID

  Care_Outcome_ID: number /* 32-bit integer */; // Foreign Key -> Care_Outcomes.Care_Outcome_ID, Has Default

  Date_Provided?: string /* ISO datetime */ | null;

  Provided_By: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;

  Care_Amount?: number /* currency amount */ | null;

  Paid_To?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Care_Case_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Care_Cases.Care_Case_ID

  PRIVATE: boolean; // Has Default

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Completed: boolean; // Has Default

  Action_Date?: string /* ISO datetime */ | null;
}

export type HouseholdCareLogRecord = HouseholdCareLog;
