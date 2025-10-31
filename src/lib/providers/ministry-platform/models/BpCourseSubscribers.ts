/**
 * Interface for bp_Course_Subscribers
* Table: bp_Course_Subscribers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BpCourseSubscribers {

  Course_Subscriber_ID: number /* 32-bit integer */; // Primary Key

  Course_ID: number /* 32-bit integer */; // Foreign Key -> bp_Courses.Course_ID

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  End_Date?: string /* ISO datetime */ | null;
}

export type BpCourseSubscribersRecord = BpCourseSubscribers;
