/**
 * Interface for bp_Courses
* Table: bp_Courses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BpCourses {

  Course_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 255 characters
   */
  Title: string /* max 255 chars */;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  Enabled: boolean; // Has Default

  Classes_Are_Ordered: boolean; // Has Default

  /**
   * Max length: 2147483647 characters
   */
  Completed_Message?: string /* max 2147483647 chars */ | null;

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Requires_Event_Participant: boolean; // Has Default

  Requires_Group_Participant: boolean; // Has Default

  Milestone_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Milestones.Milestone_ID

  Requires_Milestone: boolean; // Has Default

  Order?: number /* 32-bit integer */ | null;

  Confirmation_Message_Template_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Subscriber_Message_Template_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Confirmation_Message_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communications.Communication_ID

  Subscriber_Message_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communications.Communication_ID
}

export type BpCoursesRecord = BpCourses;
