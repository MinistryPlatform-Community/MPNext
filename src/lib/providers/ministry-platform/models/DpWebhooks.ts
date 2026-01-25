/**
 * Interface for dp_Webhooks
* Table: dp_Webhooks
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpWebhooks {

  Webhook_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Display_Name: string /* max 50 chars */;

  /**
   * Max length: 1024 characters
   */
  Description?: string /* max 1024 chars */ | null;

  /**
   * Max length: 10 characters
   */
  Http_Method: string /* max 10 chars */; // Has Default

  Uri_Template?: string /* URL */ | null;

  /**
   * Max length: 4000 characters
   */
  Body_Template?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Headers_Template?: string /* max 4000 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Trigger_Fields?: string /* max 255 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Dependent_Condition?: string /* max 4000 chars */ | null;

  Trigger_On_Create: boolean; // Has Default

  Trigger_On_Update: boolean; // Has Default

  Trigger_On_Delete: boolean; // Has Default

  Max_Retries: unknown; // Has Default

  Active: boolean; // Has Default

  Table_Name: unknown;

  Trigger_On_File_Change: boolean; // Has Default
}

export type DpWebhooksRecord = DpWebhooks;
