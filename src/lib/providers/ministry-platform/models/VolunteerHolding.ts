/**
 * Interface for Volunteer_Holding
* Table: Volunteer_Holding
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VolunteerHolding {

  Volunteer_Holding_ID: number /* 32-bit integer */; // Primary Key

  Group_Participant_ID: number /* 32-bit integer */; // Foreign Key -> Group_Participants.Group_Participant_ID

  Start_Date: string /* ISO datetime */; // Has Default

  End_Date?: string /* ISO datetime */ | null;

  Background_Check_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Background_Checks.Background_Check_ID
}

export type VolunteerHoldingRecord = VolunteerHolding;
