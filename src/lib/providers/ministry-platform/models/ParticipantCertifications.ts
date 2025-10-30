/**
 * Interface for Participant_Certifications
* Table: Participant_Certifications
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ParticipantCertifications {

  Participant_Certification_ID: number /* 32-bit integer */; // Primary Key

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Certification_Type_ID: number /* 32-bit integer */; // Foreign Key -> Certification_Types.Certification_Type_ID

  Certification_Submitted: string /* ISO datetime */;

  Certification_Completed?: string /* ISO datetime */ | null;

  Passed?: boolean | null;

  Certification_Expires?: string /* ISO datetime */ | null;

  Certification_GUID: string /* GUID/UUID */; // Has Default

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;
}

export type ParticipantCertificationsRecord = ParticipantCertifications;
