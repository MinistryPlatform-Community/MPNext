/**
 * Interface for vw_kpm_medical_release_needed
* Table: vw_kpm_medical_release_needed
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwKpmMedicalReleaseNeeded {

  Read_Only_PK: number /* 32-bit integer */; // Primary Key

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Registration_Date?: string /* ISO datetime */ | null;

  Head_1_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Head_2_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Contact_ID: number /* 32-bit integer */;

  Event_Participant_ID: number /* 32-bit integer */;

  Group_Participant_ID?: number /* 32-bit integer */ | null;
}

export type VwKpmMedicalReleaseNeededRecord = VwKpmMedicalReleaseNeeded;
