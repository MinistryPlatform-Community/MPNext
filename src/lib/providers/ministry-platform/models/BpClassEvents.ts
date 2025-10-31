/**
 * Interface for bp_Class_Events
* Table: bp_Class_Events
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface BpClassEvents {

  Class_Event_ID: number /* 32-bit integer */; // Primary Key

  Class_ID: number /* 32-bit integer */; // Foreign Key -> bp_Course_Classes.Class_ID

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID
}

export type BpClassEventsRecord = BpClassEvents;
