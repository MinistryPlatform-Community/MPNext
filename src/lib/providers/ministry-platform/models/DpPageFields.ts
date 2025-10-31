/**
 * Interface for dp_Page_Fields
* Table: dp_Page_Fields
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpPageFields {

  Page_Field_ID: number /* 32-bit integer */; // Primary Key

  Page_ID: number /* 32-bit integer */; // Foreign Key -> dp_Pages.Page_ID

  /**
   * Max length: 64 characters
   */
  Field_Name: string /* max 64 chars */;

  /**
   * Max length: 75 characters
   */
  Group_Name?: string /* max 75 chars */ | null;

  View_Order?: number /* 16-bit integer */ | null;

  Required: boolean; // Has Default

  Hidden: boolean; // Has Default

  /**
   * Max length: 128 characters
   */
  Default_Value?: string /* max 128 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Filter_Clause?: string /* max 2000 chars */ | null;

  /**
   * Max length: 64 characters
   */
  Depends_On_Field?: string /* max 64 chars */ | null;

  /**
   * Max length: 64 characters
   */
  Field_Label?: string /* max 64 chars */ | null;

  Writing_Assistant_Enabled: boolean; // Has Default
}

export type DpPageFieldsRecord = DpPageFields;
