/**
 * Interface for dp_Webhook_Invocations
* Table: dp_Webhook_Invocations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpWebhookInvocations {

  Webhook_Invocation_ID: number /* 32-bit integer */; // Primary Key

  Webhook_ID: number /* 32-bit integer */; // Foreign Key -> dp_Webhooks.Webhook_ID

  Record_ID: number /* 32-bit integer */;

  Created: string /* ISO datetime */; // Has Default

  Updated?: string /* ISO datetime */ | null;

  Status_ID: number /* 32-bit integer */; // Foreign Key -> dp_Webhook_Invocation_Statuses.Webhook_Invocation_Status_ID, Has Default

  Retries_Left: unknown; // Has Default

  Uri?: string /* URL */ | null;

  /**
   * Max length: 4000 characters
   */
  Body?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Headers?: string /* max 4000 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Response?: string /* max 2147483647 chars */ | null;

  Task_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Tasks.Task_ID
}

export type DpWebhookInvocationsRecord = DpWebhookInvocations;
