/**
 * Interface for Households
* Table: Households
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Households {

  Household_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Household_Name: string /* max 75 chars */;

  Address_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  Home_Phone?: string /* phone number */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Care_Person?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Household_Source_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Household_Sources.Household_Source_ID

  Family_Call_Number?: number /* 32-bit integer */ | null;

  Home_Phone_Unlisted: boolean; // Has Default

  Home_Address_Unlisted: boolean; // Has Default

  Bulk_Mail_Opt_Out: boolean; // Has Default

  _First_Donation?: string /* ISO datetime */ | null; // Read Only

  _Last_Donation?: string /* ISO datetime */ | null; // Read Only

  _Last_Activity?: string /* ISO datetime */ | null; // Read Only

  Alternate_Mailing_Address?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  Season_Start?: string /* ISO date (YYYY-MM-DD) */ | null;

  Season_End?: string /* ISO date (YYYY-MM-DD) */ | null;

  Repeats_Annually: boolean; // Has Default

  Driving_Distance?: number /* decimal */ | null;

  Driving_Time?: number /* decimal */ | null;
}

export type HouseholdsRecord = Households;
