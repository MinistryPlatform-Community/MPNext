/**
 * Interface for Import_Destinations
* Table: Import_Destinations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ImportDestinations {

  Import_Destination_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 255 characters
   */
  Table_Name: string /* max 255 chars */;
}

export type ImportDestinationsRecord = ImportDestinations;
