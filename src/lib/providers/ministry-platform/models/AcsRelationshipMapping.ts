/**
 * Interface for ACS_Relationship_Mapping
* Table: ACS_Relationship_Mapping
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface AcsRelationshipMapping {

  ACS_Relationship_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  ACS_Relationship_Label: string /* max 50 chars */;

  Relationship_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Relationships.Relationship_ID

  Recip_Relationship_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Relationships.Relationship_ID
}

export type AcsRelationshipMappingRecord = AcsRelationshipMapping;
