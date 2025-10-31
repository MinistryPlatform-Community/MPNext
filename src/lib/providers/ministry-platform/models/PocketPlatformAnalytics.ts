/**
 * Interface for Pocket_Platform_Analytics
* Table: Pocket_Platform_Analytics
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformAnalytics {

  Analytics_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 255 characters
   */
  Analytics_GUID: string /* max 255 chars */;

  /**
   * Max length: 128 characters
   */
  Device_ID: string /* max 128 chars */;

  User_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 100 characters
   */
  Event_Type: string /* max 100 chars */;

  /**
   * Max length: 255 characters
   */
  Previous_Screen_Name?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Screen_Name: string /* max 255 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Analytics_Data: string /* max 2147483647 chars */;

  Timestamp: string /* ISO datetime */;

  /**
   * Max length: 10 characters
   */
  Platform: string /* max 10 chars */;

  /**
   * Max length: 120 characters
   */
  Screen_Size: string /* max 120 chars */;

  /**
   * Max length: 12 characters
   */
  OS_Version: string /* max 12 chars */;

  /**
   * Max length: 4 characters
   */
  Language: string /* max 4 chars */;

  Event_ID?: number /* 32-bit integer */ | null;

  Group_ID?: number /* 32-bit integer */ | null;

  Opportunity_ID?: number /* 32-bit integer */ | null;

  Sermon_ID?: number /* 32-bit integer */ | null;

  Sermon_Series_ID?: number /* 32-bit integer */ | null;

  GCE_ID?: number /* 32-bit integer */ | null;

  Form_ID?: number /* 32-bit integer */ | null;

  Journey_ID?: number /* 32-bit integer */ | null;

  Milestone_ID?: number /* 32-bit integer */ | null;

  Reading_Plan_ID?: number /* 32-bit integer */ | null;

  Reading_Plan_Day_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 150 characters
   */
  Dashboard_Item_ID?: string /* max 150 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Dashboard_Display_Name?: string /* max 255 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Dashboard_Item_Content?: string /* max 2147483647 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Webview_URL?: string /* max 1000 chars */ | null;

  Summarized: boolean; // Has Default

  Metric_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Metrics.Metric_ID

  /**
   * Max length: 255 characters
   */
  Contact_Display_Name?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Event_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Form_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  GCE_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Group_Name?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Journey_Name?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Milestone_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Opportunity_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Reading_Plan_Day_Name?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Reading_Plan_Name?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Sermon_Series_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Sermon_Title?: string /* max 255 chars */ | null;

  App_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 200 characters
   */
  App_Slug?: string /* max 200 chars */ | null;
}

export type PocketPlatformAnalyticsRecord = PocketPlatformAnalytics;
