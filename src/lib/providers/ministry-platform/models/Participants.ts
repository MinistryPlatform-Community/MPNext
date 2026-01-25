/**
 * Interface for Participants
* Table: Participants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Participants {

  Participant_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 254 characters
   */
  Red_Flag_Notes?: string /* max 254 chars */ | null;

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Participant_Type_ID: number /* 32-bit integer */; // Foreign Key -> Participant_Types.Participant_Type_ID

  Member_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Member_Statuses.Member_Status_ID

  Participant_Engagement_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Participant_Engagement.Participant_Engagement_ID

  Participant_Start_Date: string /* ISO datetime */;

  Participant_End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 1000 characters
   */
  Notes?: string /* max 1000 chars */ | null;

  _First_Attendance_Ever?: string /* ISO datetime */ | null; // Read Only

  _Second_Attendance_Ever?: string /* ISO datetime */ | null; // Read Only

  _Third_Attendance_Ever?: string /* ISO datetime */ | null; // Read Only

  _Last_Attendance_Ever?: string /* ISO datetime */ | null; // Read Only

  /**
   * Max length: 128 characters
   */
  _Background_Check_Type?: string /* max 128 chars */ | null; // Read Only

  /**
   * Max length: 50 characters
   */
  _Background_Check_Status?: string /* max 50 chars */ | null; // Read Only

  _Background_Check_Date?: string /* ISO datetime */ | null; // Read Only

  Church_of_Record?: number /* 32-bit integer */ | null; // Foreign Key -> Households.Household_ID

  /**
   * Max length: 75 characters
   */
  Baptism_Parish_Name?: string /* max 75 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Baptism_Parish_Address?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Birth_Certificate_Address?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Birth_Certificate_City?: string /* max 254 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Birth_Certificate_State?: string /* max 15 chars */ | null;
}

export type ParticipantsRecord = Participants;
