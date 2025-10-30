/**
 * Interface for Schedules
* Table: Schedules
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach
 * Generated from column metadata
 */
export interface Schedules {

  Schedule_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 255 characters
   */
  Schedule_Name: string /* max 255 chars */;

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Schedule_Status_ID: number /* 32-bit integer */; // Foreign Key -> Schedule_Statuses.Schedule_Status_ID, Has Default

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Primary_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Allow_Volunteer_Signup: boolean; // Has Default

  Accept_All_Assignments: boolean; // Has Default

  Reminder_Sent: boolean; // Has Default

  Days_Out_to_Remind: number /* 32-bit integer */; // Has Default
}

export type SchedulesRecord = Schedules;
