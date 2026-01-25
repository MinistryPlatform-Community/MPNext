/**
 * Interface for dp_Communication_Snippets
* Table: dp_Communication_Snippets
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpCommunicationSnippets {

  Communication_Snippet_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Name: string /* max 50 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Value: string /* max 2147483647 chars */;

  Pertains_To?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Pages.Page_ID
}

export type DpCommunicationSnippetsRecord = DpCommunicationSnippets;
