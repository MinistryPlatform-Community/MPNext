/**
 * Interface for KnowBe4_Users
* Table: KnowBe4_Users
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface Knowbe4Users {

  KnowBe4_User_ID: number /* 32-bit integer */; // Primary Key

  KnowBe4_ID: number /* 32-bit integer */;

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 100 characters
   */
  KnowBe4_First_Name?: string /* max 100 chars */ | null;

  /**
   * Max length: 100 characters
   */
  KnowBe4_Last_Name?: string /* max 100 chars */ | null;

  /**
   * Max length: 100 characters
   */
  KnowBe4_Email_Address?: string /* max 100 chars */ | null;
}

export type Knowbe4UsersRecord = Knowbe4Users;
