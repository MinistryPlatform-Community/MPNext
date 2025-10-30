/**
 * Interface for Books
* Table: Books
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Books {

  Book_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 150 characters
   */
  Title: string /* max 150 chars */;

  /**
   * Max length: 15 characters
   */
  ISBN?: string /* max 15 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Cost?: number /* currency amount */ | null;

  Start_Date?: string /* ISO datetime */ | null;

  Genre_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Genres.Genre_ID
}

export type BooksRecord = Books;
