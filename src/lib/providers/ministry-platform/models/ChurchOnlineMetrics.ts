/**
 * Interface for Church_Online_Metrics
* Table: Church_Online_Metrics
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface ChurchOnlineMetrics {

  Church_Online_Metric_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 150 characters
   */
  Event_Title?: string /* max 150 chars */ | null;

  Date?: string /* ISO datetime */ | null;

  Watch_Type?: number /* 32-bit integer */ | null; // Foreign Key -> Church_Online_Watch_Types.Church_Online_Watch_Type_ID

  /**
   * Max length: 150 characters
   */
  City?: string /* max 150 chars */ | null;

  /**
   * Max length: 100 characters
   */
  State?: string /* max 100 chars */ | null;

  /**
   * Max length: 2 characters
   */
  Country?: string /* max 2 chars */ | null;

  /**
   * Max length: 300 characters
   */
  User_Agent_String?: string /* max 300 chars */ | null;

  Watch_Time?: number /* 32-bit integer */ | null;

  Latitude?: number /* decimal */ | null;

  Longitude?: number /* decimal */ | null;

  Closest_Congregation?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Distance_To_Closest_Congregation?: number /* decimal */ | null;

  /**
   * Max length: 15 characters
   */
  IP_Address?: string /* max 15 chars */ | null;
}

export type ChurchOnlineMetricsRecord = ChurchOnlineMetrics;
