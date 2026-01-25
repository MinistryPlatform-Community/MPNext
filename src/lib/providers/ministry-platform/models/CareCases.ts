/**
 * Interface for Care_Cases
* Table: Care_Cases
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface CareCases {

  Care_Case_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Title?: string /* max 128 chars */ | null;

  /**
   * Max length: 512 characters
   */
  Description?: string /* max 512 chars */ | null;

  Household_ID: number /* 32-bit integer */; // Foreign Key -> Households.Household_ID

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Care_Case_Type_ID: number /* 32-bit integer */; // Foreign Key -> Care_Case_Types.Care_Case_Type_ID

  Location_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Locations.Location_ID

  Case_Manager?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Share_With_Group_Leaders: boolean;

  Program_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Programs.Program_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type CareCasesRecord = CareCases;
