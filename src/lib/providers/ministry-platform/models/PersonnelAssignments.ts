/**
 * Interface for Personnel_Assignments
* Table: Personnel_Assignments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelAssignments {

  Personnel_Assignment_ID: number /* 32-bit integer */; // Primary Key

  Personnel_ID: number /* 32-bit integer */; // Foreign Key -> Personnel.Personnel_ID

  Personnel_Assignment_Type_ID: number /* 32-bit integer */; // Foreign Key -> Personnel_Assignment_Types.Personnel_Assignment_Type_ID

  Location_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Locations.Location_ID

  Assignment_Role_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Assignment_Roles.Assignment_Role_ID

  Assignment_Start?: string /* ISO datetime */ | null;

  Assignment_End?: string /* ISO datetime */ | null;

  Primary_Assignment: boolean; // Has Default

  /**
   * Max length: 2000 characters
   */
  Assignment_Comments?: string /* max 2000 chars */ | null;

  Mail_To_Location?: boolean | null;

  Contract_Signed?: boolean | null; // Has Default

  Hours_Per_Week?: number /* 32-bit integer */ | null;

  Hourly_Rate?: number /* currency amount */ | null;

  Annual_Salary?: number /* currency amount */ | null;

  Vacation_Hours?: number /* 32-bit integer */ | null;
}

export type PersonnelAssignmentsRecord = PersonnelAssignments;
