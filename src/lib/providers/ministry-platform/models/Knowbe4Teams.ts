/**
 * Interface for KnowBe4_Teams
* Table: KnowBe4_Teams
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface Knowbe4Teams {

  KnowBe4_Team_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Team_Name: string /* max 100 chars */;

  /**
   * Max length: 1000 characters
   */
  Description?: string /* max 1000 chars */ | null;
}

export type Knowbe4TeamsRecord = Knowbe4Teams;
