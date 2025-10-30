/**
 * Interface for Opportunity_Attributes
* Table: Opportunity_Attributes
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface OpportunityAttributes {

  Opportunity_Attribute_ID: number /* 32-bit integer */; // Primary Key

  Attribute_ID: number /* 32-bit integer */; // Foreign Key -> Attributes.Attribute_ID

  Opportunity_ID: number /* 32-bit integer */; // Foreign Key -> Opportunities.Opportunity_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 255 characters
   */
  Notes?: string /* max 255 chars */ | null;
}

export type OpportunityAttributesRecord = OpportunityAttributes;
