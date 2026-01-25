/**
 * Interface for Group_Participants
* Table: Group_Participants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface GroupParticipants {

  Group_Participant_ID: number /* 32-bit integer */; // Primary Key

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Group_Role_ID: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Employee_Role: boolean; // Has Default

  Hours_Per_Week?: number /* 16-bit integer */ | null;

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  Need_Book: boolean; // Has Default

  Email_Opt_Out: boolean; // Has Default

  Share_With_Group: boolean; // Has Default

  Auto_Promote: boolean; // Has Default

  _First_Attendance?: string /* ISO datetime */ | null; // Read Only

  _Second_Attendance?: string /* ISO datetime */ | null; // Read Only

  _Third_Attendance?: string /* ISO datetime */ | null; // Read Only

  _Last_Attendance?: string /* ISO datetime */ | null; // Read Only

  Show_Email: boolean; // Has Default

  Show_Phone: boolean; // Has Default

  Show_Last_Name: boolean; // Has Default

  Show_Photo: boolean; // Has Default

  _Show_Birthday: boolean; // Read Only, Has Default

  _Show_Email: boolean; // Read Only, Has Default

  _Show_Home_Phone: boolean; // Read Only, Has Default

  _Show_Mobile_Phone: boolean; // Read Only, Has Default

  _Show_Address: boolean; // Read Only, Has Default

  _Show_Photo: boolean; // Read Only, Has Default
}

export type GroupParticipantsRecord = GroupParticipants;
