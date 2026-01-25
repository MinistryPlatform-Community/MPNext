/**
 * Interface for Import_Templates
* Table: Import_Templates
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ImportTemplates {

  Import_Template_ID: number /* 32-bit integer */; // Primary Key

  Import_Destination_ID: number /* 32-bit integer */; // Foreign Key -> Import_Destinations.Import_Destination_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 50 characters
   */
  Import_Template_Name: string /* max 50 chars */;

  /**
   * Max length: 2147483647 characters
   */
  _Template: string /* max 2147483647 chars */;
}

export type ImportTemplatesRecord = ImportTemplates;
