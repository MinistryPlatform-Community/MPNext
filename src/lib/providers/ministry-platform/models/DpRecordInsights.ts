/**
 * Interface for dp_Record_Insights
* Table: dp_Record_Insights
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpRecordInsights {

  Record_Insight_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Title: string /* max 50 chars */;

  Page_ID: number /* 32-bit integer */; // Foreign Key -> dp_Pages.Page_ID

  Sub_Page_View_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Sub_Page_Views.Sub_Page_View_ID

  /**
   * Max length: 2147483647 characters
   */
  Template: string /* max 2147483647 chars */;

  View_Order: number /* 16-bit integer */; // Has Default

  Active: boolean; // Has Default
}

export type DpRecordInsightsRecord = DpRecordInsights;
