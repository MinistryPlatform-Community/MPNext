/**
 * Interface for Schedule_Roles
* Table: Schedule_Roles
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ScheduleRoles {

  Schedule_Role_ID: number /* 32-bit integer */; // Primary Key

  Schedule_ID: number /* 32-bit integer */; // Foreign Key -> Schedules.Schedule_ID

  Group_Role_ID: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Number_Of_Volunteers: number /* 32-bit integer */; // Has Default

  Start_Time?: string /* ISO time (HH:MM:SS) */ | null;

  End_Time?: string /* ISO time (HH:MM:SS) */ | null;

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Role_Label?: string /* max 255 chars */ | null;
}

export type ScheduleRolesRecord = ScheduleRoles;
