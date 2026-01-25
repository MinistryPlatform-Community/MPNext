/**
 * Interface for dp_Configuration_Lists
* Table: dp_Configuration_Lists
 * Access Level: ReadWrite
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface DpConfigurationLists {

  Configuration_List_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Application_Code: string /* max 50 chars */;

  /**
   * Max length: 128 characters
   */
  List_Name: string /* max 128 chars */;

  /**
   * Max length: 128 characters
   */
  Key_Name: string /* max 128 chars */;

  /**
   * Max length: 4000 characters
   */
  Value?: string /* max 4000 chars */ | null;

  /**
   * Max length: 250 characters
   */
  _Warning: string /* max 250 chars */; // Read Only, Has Default
}

export type DpConfigurationListsRecord = DpConfigurationLists;
