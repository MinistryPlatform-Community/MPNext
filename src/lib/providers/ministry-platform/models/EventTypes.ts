/**
 * Interface for Event_Types
* Table: Event_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface EventTypes {

  Event_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Event_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Color?: string /* max 25 chars */ | null;

  Show_On_MPMobile: boolean; // Has Default

  Omit_From_Engagement_Attendance: boolean; // Has Default

  Auto_Close_Registrations: boolean; // Has Default
}

export type EventTypesRecord = EventTypes;
