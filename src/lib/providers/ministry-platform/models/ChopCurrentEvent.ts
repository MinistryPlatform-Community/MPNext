/**
 * Interface for ChOP_Current_Event
* Table: ChOP_Current_Event
 * Access Level: ReadWrite
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ChopCurrentEvent {

  ChOP_Current_Event_ID: number /* 32-bit integer */; // Primary Key

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 100 characters
   */
  Title?: string /* max 100 chars */ | null;
}

export type ChopCurrentEventRecord = ChopCurrentEvent;
