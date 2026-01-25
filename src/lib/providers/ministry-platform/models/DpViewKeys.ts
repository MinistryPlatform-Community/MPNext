/**
 * Interface for dp_View_Keys
* Table: dp_View_Keys
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpViewKeys {

  View_Key_ID: number /* 32-bit integer */; // Primary Key

  View_Name: unknown;

  /**
   * Max length: 128 characters
   */
  Field_Name: string /* max 128 chars */;

  Foreign_Table_Name: unknown;

  /**
   * Max length: 128 characters
   */
  Foreign_Field_Name: string /* max 128 chars */;
}

export type DpViewKeysRecord = DpViewKeys;
