/**
 * Interface for Groups
* Table: Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Groups {

  Group_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Group_Name: string /* max 75 chars */;

  Group_Type_ID: number /* 32-bit integer */; // Foreign Key -> Group_Types.Group_Type_ID

  Ministry_ID: number /* 32-bit integer */; // Foreign Key -> Ministries.Ministry_ID

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  Primary_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Target_Size?: number /* 32-bit integer */ | null;

  Parent_Group?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Priority_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Priorities.Priority_ID

  Offsite_Meeting_Address?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  Group_Is_Full: boolean; // Has Default

  Available_Online: boolean; // Has Default

  Meets_Online: boolean; // Has Default

  Life_Stage_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Life_Stages.Life_Stage_ID

  Group_Focus_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Group_Focuses.Group_Focus_ID

  Meeting_Time?: string /* ISO time (HH:MM:SS) */ | null;

  Meeting_Day_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Meeting_Days.Meeting_Day_ID

  Meeting_Frequency_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Meeting_Frequencies.Meeting_Frequency_ID

  Meeting_Duration_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Meeting_Durations.Meeting_Duration_ID

  Required_Book?: number /* 32-bit integer */ | null; // Foreign Key -> Books.Book_ID

  Descended_From?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Reason_Ended?: number /* 32-bit integer */ | null; // Foreign Key -> Group_Ended_Reasons.Group_Ended_Reason_ID

  _Last_Attendance_Posted?: string /* ISO datetime */ | null; // Read Only

  _Last_Group_Member_Changed?: string /* ISO datetime */ | null; // Read Only

  "Secure_Check-in": boolean; // Has Default

  Suppress_Nametag: boolean; // Has Default

  Suppress_Care_Note: boolean; // Has Default

  On_Classroom_Manager: boolean; // Has Default

  Promote_to_Group?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Age_in_Months_to_Promote?: number /* 32-bit integer */ | null;

  Promote_Weekly: boolean; // Has Default

  Promotion_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Promote_Participants_Only: boolean; // Has Default

  Send_Attendance_Notification: boolean; // Has Default

  Send_Service_Notification: boolean; // Has Default

  Enable_Discussion: boolean; // Has Default

  SMS_Number?: number /* 32-bit integer */ | null; // Foreign Key -> dp_SMS_Numbers.SMS_Number_ID

  Default_Meeting_Room?: number /* 32-bit integer */ | null; // Foreign Key -> Rooms.Room_ID

  Create_Next_Meeting: boolean; // Has Default

  Next_Scheduled_Meeting?: string /* ISO datetime */ | null;

  Available_On_App?: boolean | null;
}

export type GroupsRecord = Groups;
