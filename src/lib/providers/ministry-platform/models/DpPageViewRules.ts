/**
 * Interface for dp_Page_View_Rules
* Table: dp_Page_View_Rules
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpPageViewRules {

  Rule_ID: number /* 32-bit integer */; // Primary Key

  Page_View_ID: number /* 32-bit integer */; // Foreign Key -> dp_Page_Views.Page_View_ID

  /**
   * Max length: 64 characters
   */
  Field_Name: string /* max 64 chars */;

  /**
   * Max length: 800 characters
   */
  Condition?: string /* max 800 chars */ | null;

  Text_Color?: unknown | null;

  Background_Color?: unknown | null;

  /**
   * Max length: 32 characters
   */
  Image_Name?: string /* max 32 chars */ | null;

  Show_Percentage: boolean; // Has Default

  Show_Label: boolean; // Has Default

  Format_As?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Field_Format_Types.Field_Format_Type_ID
}

export type DpPageViewRulesRecord = DpPageViewRules;
