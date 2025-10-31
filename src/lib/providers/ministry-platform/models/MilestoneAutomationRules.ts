/**
 * Interface for Milestone_Automation_Rules
* Table: Milestone_Automation_Rules
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MilestoneAutomationRules {

  Milestone_Automation_Rule_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Automation_Rule: string /* max 50 chars */;

  /**
   * Max length: 500 characters
   */
  Automation_Notes?: string /* max 500 chars */ | null;
}

export type MilestoneAutomationRulesRecord = MilestoneAutomationRules;
