/**
 * Interface for dp_Bookmarks
* Table: dp_Bookmarks
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpBookmarks {

  Bookmark_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Name: string /* max 100 chars */;

  URL?: string /* URL */ | null;

  ViewOrder: number /* 32-bit integer */;
}

export type DpBookmarksRecord = DpBookmarks;
