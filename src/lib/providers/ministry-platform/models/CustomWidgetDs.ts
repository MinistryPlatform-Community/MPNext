/**
 * Interface for Custom_Widget_DS
* Table: Custom_Widget_DS
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface CustomWidgetDs {

  Custom_Widget_DS_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Name: string /* max 50 chars */;

  Table: unknown;

  /**
   * Max length: 2000 characters
   */
  Select?: string /* max 2000 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Filter: string /* max 2000 chars */;

  /**
   * Max length: 256 characters
   */
  OrderBy?: string /* max 256 chars */ | null;

  /**
   * Max length: 256 characters
   */
  GroupBy?: string /* max 256 chars */ | null;

  Top?: number /* 32-bit integer */ | null;

  Auth_Required: boolean; // Has Default
}

export type CustomWidgetDsRecord = CustomWidgetDs;
