/**
 * Interface for dp_Communication_Publications
* Table: dp_Communication_Publications
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpCommunicationPublications {

  Communication_Publication_ID: number /* 32-bit integer */; // Primary Key

  Communication_ID: number /* 32-bit integer */; // Foreign Key -> dp_Communications.Communication_ID

  Publication_ID: number /* 32-bit integer */; // Foreign Key -> dp_Publications.Publication_ID
}

export type DpCommunicationPublicationsRecord = DpCommunicationPublications;
