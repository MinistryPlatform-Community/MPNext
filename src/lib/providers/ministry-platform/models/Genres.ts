/**
 * Interface for Genres
* Table: Genres
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Genres {

  Genre_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Genre: string /* max 50 chars */;
}

export type GenresRecord = Genres;
