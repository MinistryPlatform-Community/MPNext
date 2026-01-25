/**
 * Interface for mp_vw_Last_Known_Activity
* Table: mp_vw_Last_Known_Activity
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MpVwLastKnownActivity {

  Participant_ID: number /* 32-bit integer */;

  Last_Known_Activity?: string /* ISO date (YYYY-MM-DD) */ | null;
}

export type MpVwLastKnownActivityRecord = MpVwLastKnownActivity;
