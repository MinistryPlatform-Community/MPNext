/**
 * Interface for Sacraments
* Table: Sacraments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Sacraments {

  Sacrament_ID: number /* 32-bit integer */; // Primary Key

  Sacrament_Type_ID: number /* 32-bit integer */; // Foreign Key -> Sacrament_Types.Sacrament_Type_ID

  Date_Received?: string /* ISO date (YYYY-MM-DD) */ | null;

  Date_Received_Accuracy_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Date_Accuracies.Date_Accuracy_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  /**
   * Max length: 100 characters
   */
  Participant_Name?: string /* max 100 chars */ | null;

  Performed_By_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 100 characters
   */
  Performed_By_Name?: string /* max 100 chars */ | null;

  Place_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Sacrament_Places.Sacrament_Place_ID

  /**
   * Max length: 128 characters
   */
  Place_Name?: string /* max 128 chars */ | null;

  /**
   * Max length: 10 characters
   */
  Volume?: string /* max 10 chars */ | null;

  Page?: number /* 32-bit integer */ | null;

  Entry?: number /* 32-bit integer */ | null;

  /**
   * Max length: 128 characters
   */
  Place_of_Birth?: string /* max 128 chars */ | null;

  Father_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 100 characters
   */
  Name_of_Father?: string /* max 100 chars */ | null;

  Mother_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 100 characters
   */
  Name_of_Mother?: string /* max 100 chars */ | null;

  Profession_of_Faith?: boolean | null; // Has Default

  Profession_of_Faith_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Verified?: boolean | null; // Has Default

  Notification_Received?: boolean | null; // Has Default

  /**
   * Max length: 128 characters
   */
  Place_of_Burial?: string /* max 128 chars */ | null;

  Date_of_Burial?: string /* ISO date (YYYY-MM-DD) */ | null;

  Spouse_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Participants.Participant_ID

  /**
   * Max length: 100 characters
   */
  Spouse_Name?: string /* max 100 chars */ | null;

  Interfaith?: boolean | null; // Has Default

  Annulment?: boolean | null; // Has Default

  /**
   * Max length: 15 characters
   */
  Protocol_Number?: string /* max 15 chars */ | null;

  /**
   * Max length: 100 characters
   */
  Confirmation_Saint?: string /* max 100 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;

  Ordination_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Ordination_Types.Ordination_Type_ID
}

export type SacramentsRecord = Sacraments;
