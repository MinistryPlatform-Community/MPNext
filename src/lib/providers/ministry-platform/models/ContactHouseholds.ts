/**
 * Interface for Contact_Households
* Table: Contact_Households
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ContactHouseholds {

  Contact_Household_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Household_ID: number /* 32-bit integer */; // Foreign Key -> Households.Household_ID

  Household_Position_ID: number /* 32-bit integer */; // Foreign Key -> Household_Positions.Household_Position_ID

  Household_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Household_Types.Household_Type_ID

  Primary_Family: boolean; // Has Default

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;

  End_Date?: string /* ISO datetime */ | null;
}

export type ContactHouseholdsRecord = ContactHouseholds;
