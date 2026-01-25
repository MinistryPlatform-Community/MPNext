/**
 * Interface for Audience_Members
* Table: Audience_Members
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface AudienceMembers {

  Audience_Member_ID: number /* 32-bit integer */; // Primary Key

  Audience_ID: number /* 32-bit integer */; // Foreign Key -> Audiences.Audience_ID

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Forced_Filter: boolean; // Has Default

  Active: boolean; // Has Default

  Last_Update_Date: string /* ISO datetime */;
}

export type AudienceMembersRecord = AudienceMembers;
