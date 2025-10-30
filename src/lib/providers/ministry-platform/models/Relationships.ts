/**
 * Interface for Relationships
* Table: Relationships
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Relationships {

  Relationship_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Relationship_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Male_Label?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Female_Label?: string /* max 50 chars */ | null;

  Reciprocal_Relationship_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Relationships.Relationship_ID
}

export type RelationshipsRecord = Relationships;
