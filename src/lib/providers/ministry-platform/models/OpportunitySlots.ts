/**
 * Interface for Opportunity_Slots
* Table: Opportunity_Slots
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface OpportunitySlots {

  Opportunity_Slot_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Title: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Subtitle?: string /* max 50 chars */ | null;

  Date: string /* ISO datetime */;

  Opportunity_ID: number /* 32-bit integer */; // Foreign Key -> Opportunities.Opportunity_ID

  Num_Slots: number /* 32-bit integer */;

  Primary_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Position?: number /* 32-bit integer */ | null;
}

export type OpportunitySlotsRecord = OpportunitySlots;
