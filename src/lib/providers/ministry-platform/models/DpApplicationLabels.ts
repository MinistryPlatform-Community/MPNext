/**
 * Interface for dp_Application_Labels
* Table: dp_Application_Labels
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpApplicationLabels {

  Application_Label_ID: number /* 32-bit integer */; // Primary Key

  API_Client_ID: number /* 32-bit integer */; // Foreign Key -> dp_API_Clients.API_Client_ID

  /**
   * Max length: 128 characters
   */
  Label_Name: string /* max 128 chars */;

  /**
   * Max length: 255 characters
   */
  English: string /* max 255 chars */;

  /**
   * Max length: 255 characters
   */
  Spanish?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Chinese?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Portuguese?: string /* max 255 chars */ | null;
}

export type DpApplicationLabelsRecord = DpApplicationLabels;
