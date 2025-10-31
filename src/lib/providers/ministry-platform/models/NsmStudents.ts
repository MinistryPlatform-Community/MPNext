/**
 * Interface for NSM_Students
* Table: NSM_Students
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface NsmStudents {

  Student_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Setup_Date: string /* ISO date (YYYY-MM-DD) */; // Has Default

  Coach?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Student_Status_ID: number /* 32-bit integer */; // Foreign Key -> NSM_Student_Statuses.Student_Status_ID, Has Default

  Student_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> NSM_Student_Types.Student_Type_ID

  Student_Concentration_ID?: number /* 32-bit integer */ | null; // Foreign Key -> NSM_Student_Concentrations.Student_Concentration_ID

  Student_Source_ID?: number /* 32-bit integer */ | null; // Foreign Key -> NSM_Student_Sources.Student_Source_ID

  /**
   * Max length: 2000 characters
   */
  Onboarding_Notes?: string /* max 2000 chars */ | null;

  Follow_Up_Complete?: string /* ISO date (YYYY-MM-DD) */ | null;

  Application?: string /* ISO date (YYYY-MM-DD) */ | null;

  Scholarship_Application?: string /* ISO date (YYYY-MM-DD) */ | null;

  Applied_NSM: boolean; // Has Default

  Applied_LCU: boolean; // Has Default

  FEC_Materials_Provided: boolean; // Has Default

  Pre_Assessment_Attended?: string /* ISO date (YYYY-MM-DD) */ | null;

  Executive_Team_Approval?: string /* ISO date (YYYY-MM-DD) */ | null;

  Accepted_NSM: boolean; // Has Default

  Accepted_LCU: boolean; // Has Default

  Residence_Served?: string /* ISO date (YYYY-MM-DD) */ | null;

  Graduation_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Student_Graduation_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> NSM_Student_Graduation_Types.Student_Graduation_Type_ID
}

export type NsmStudentsRecord = NsmStudents;
