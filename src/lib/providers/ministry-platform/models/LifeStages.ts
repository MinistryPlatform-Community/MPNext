/**
 * Interface for Life_Stages
* Table: Life_Stages
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface LifeStages {

  Life_Stage_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Life_Stage: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type LifeStagesRecord = LifeStages;
