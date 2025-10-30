/**
 * Interface for Volunteer_Unavailable_Dates
* Table: Volunteer_Unavailable_Dates
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VolunteerUnavailableDates {

  Volunteer_Unavailable_Date_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Start_Date: string /* ISO date (YYYY-MM-DD) */;

  End_Date: string /* ISO date (YYYY-MM-DD) */;
}

export type VolunteerUnavailableDatesRecord = VolunteerUnavailableDates;
