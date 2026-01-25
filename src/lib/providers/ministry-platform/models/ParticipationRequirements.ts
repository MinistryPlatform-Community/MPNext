/**
 * Interface for Participation_Requirements
* Table: Participation_Requirements
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ParticipationRequirements {

  Participation_Requirement_ID: number /* 32-bit integer */; // Primary Key

  Group_Role_ID: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Background_Check_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Background_Check_Types.Background_Check_Type_ID

  Certification_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Certification_Types.Certification_Type_ID

  Milestone_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Milestones.Milestone_ID

  Custom_Form_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Forms.Form_ID

  Strictly_Enforced: boolean; // Has Default

  /**
   * Max length: 75 characters
   */
  Requirement_Name?: string /* max 75 chars */ | null;
}

export type ParticipationRequirementsRecord = ParticipationRequirements;
