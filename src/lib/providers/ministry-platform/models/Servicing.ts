/**
 * Interface for Servicing
* Table: Servicing
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Servicing {

  Service_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Service_Name: string /* max 50 chars */;

  Service_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Service_Types.Service_Type_ID

  /**
   * Max length: 50 characters
   */
  Unit?: string /* max 50 chars */ | null;

  Price?: number /* currency amount */ | null;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Team_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Standard_Service: boolean; // Has Default

  Auto_Approve: boolean; // Has Default

  Days_To_Remind?: number /* 32-bit integer */ | null;
}

export type ServicingRecord = Servicing;
