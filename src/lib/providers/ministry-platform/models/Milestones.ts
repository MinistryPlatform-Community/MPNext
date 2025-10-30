/**
 * Interface for Milestones
* Table: Milestones
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Milestones {

  Milestone_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Milestone_Title: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Journey_ID: number /* 32-bit integer */; // Foreign Key -> Journeys.Journey_ID

  Next_Milestone?: number /* 32-bit integer */ | null; // Foreign Key -> Milestones.Milestone_ID

  /**
   * Max length: 2000 characters
   */
  Follow_Up_Notes?: string /* max 2000 chars */ | null;

  Add_to_Event_Metrics: boolean; // Has Default

  /**
   * Max length: 2147483647 characters
   */
  Letter_Body?: string /* max 2147483647 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Letter_From?: string /* max 2147483647 chars */ | null;

  Sort_Order?: number /* 32-bit integer */ | null;

  Discontinued: boolean; // Has Default

  On_Connection_Card: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Icon?: string /* max 50 chars */ | null;

  Gamify?: boolean | null;

  /**
   * Max length: 70 characters
   */
  Call_To_Action_Button_Text?: string /* max 70 chars */ | null;

  /**
   * Max length: 70 characters
   */
  Call_To_Action?: string /* max 70 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Scripture_on_Certificate?: string /* max 2000 chars */ | null;

  Show_on_Certificate: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Certificate_Person_Label?: string /* max 50 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type MilestonesRecord = Milestones;
