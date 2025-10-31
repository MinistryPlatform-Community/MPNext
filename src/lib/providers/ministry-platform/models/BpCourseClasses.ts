/**
 * Interface for bp_Course_Classes
* Table: bp_Course_Classes
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BpCourseClasses {

  Class_ID: number /* 32-bit integer */; // Primary Key

  Course_ID: number /* 32-bit integer */; // Foreign Key -> bp_Courses.Course_ID

  /**
   * Max length: 255 characters
   */
  Title: string /* max 255 chars */;

  /**
   * Max length: 255 characters
   */
  Subtitle?: string /* max 255 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Page_Html?: string /* max 2147483647 chars */ | null;

  Enabled: boolean; // Has Default

  /**
   * Max length: 2147483647 characters
   */
  Completed_Message?: string /* max 2147483647 chars */ | null;

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Order?: number /* 32-bit integer */ | null;

  Unlock_on_Event_Start: boolean; // Has Default

  Confirmation_Message_Template_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Subscriber_Message_Template_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Confirmation_Message_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communications.Communication_ID

  Subscriber_Message_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communications.Communication_ID
}

export type BpCourseClassesRecord = BpCourseClasses;
