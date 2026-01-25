/**
 * Interface for Forms
* Table: Forms
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Forms {

  Form_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Form_Title: string /* max 50 chars */;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 2147483647 characters
   */
  Instructions?: string /* max 2147483647 chars */ | null;

  Get_Contact_Info: boolean;

  Get_Address_Info: boolean;

  Form_GUID: string /* GUID/UUID */; // Has Default

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Complete_Message?: string /* max 2147483647 chars */ | null;

  Primary_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Notify: boolean; // Has Default

  Response_Message?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Months_Till_Expires?: number /* 32-bit integer */ | null;

  Expiring_Soon_Days?: number /* 32-bit integer */ | null;

  Force_Login: boolean; // Has Default
}

export type FormsRecord = Forms;
