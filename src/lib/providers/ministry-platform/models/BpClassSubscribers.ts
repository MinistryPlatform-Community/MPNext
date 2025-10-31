/**
 * Interface for bp_Class_Subscribers
* Table: bp_Class_Subscribers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BpClassSubscribers {

  Class_Subscriber_ID: number /* 32-bit integer */; // Primary Key

  Class_ID: number /* 32-bit integer */; // Foreign Key -> bp_Course_Classes.Class_ID

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  End_Date?: string /* ISO datetime */ | null;
}

export type BpClassSubscribersRecord = BpClassSubscribers;
