/**
 * Interface for Participant_Types
* Table: Participant_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ParticipantTypes {

  Participant_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Participant_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Can_Access_Directory: boolean; // Has Default

  Show_In_Directory: boolean; // Has Default

  Send_Birthday_Email: boolean; // Has Default

  Auto_Inactivate: boolean; // Has Default

  Days_Without_Activity?: number /* 32-bit integer */ | null;

  Set_Inactivated_To?: number /* 32-bit integer */ | null; // Foreign Key -> Participant_Types.Participant_Type_ID

  Publication_Unsubscribe?: boolean | null; // Has Default

  Auto_Reactivate: boolean; // Has Default

  Days_Before_Reactivating?: number /* 32-bit integer */ | null; // Has Default

  Active_Days_Past_30_Days?: number /* 32-bit integer */ | null; // Has Default

  Set_Reactivated_To?: number /* 32-bit integer */ | null; // Foreign Key -> Participant_Types.Participant_Type_ID

  Reactivate_with_Family: boolean; // Has Default
}

export type ParticipantTypesRecord = ParticipantTypes;
