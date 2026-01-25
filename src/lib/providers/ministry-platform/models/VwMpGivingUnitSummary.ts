/**
 * Interface for vw_mp_giving_unit_summary
* Table: vw_mp_giving_unit_summary
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwMpGivingUnitSummary {

  Household_ID?: number /* 32-bit integer */ | null; // Primary Key, Foreign Key -> Households.Household_ID

  /**
   * Max length: 75 characters
   */
  Household_Name: string /* max 75 chars */;

  /**
   * Max length: 103 characters
   */
  Primary_Individuals?: string /* max 103 chars */ | null;

  /**
   * Max length: 9 characters
   */
  Giving_Unit_Type: string /* max 9 chars */;

  /**
   * Max length: 97 characters
   */
  Giving_Notes: string /* max 97 chars */;

  Giving_YTD: number /* currency amount */;

  Giving_YTD_Last_Year: number /* currency amount */;

  Giving_Variance_Last_YTD?: number /* currency amount */ | null;

  Giving_Last_Year: number /* currency amount */;

  /**
   * Max length: 47 characters
   */
  Online_Giving_Notes: string /* max 47 chars */;

  Online_Giving_YTD: number /* currency amount */;

  Online_Giving_YTD_Last_Year: number /* currency amount */;

  Online_Giving_Variance_Last_YTD?: number /* currency amount */ | null;

  Online_Giving_Last_Year: number /* currency amount */;

  Gifts_YTD: number /* 32-bit integer */;

  Gifts_YTD_Last_Year: number /* 32-bit integer */;

  Gifts_Variance_Last_YTD?: number /* 32-bit integer */ | null;

  Gifts_Last_Year: number /* 32-bit integer */;

  Online_Gifts_YTD: number /* 32-bit integer */;

  Online_Gifts_YTD_Last_Year: number /* 32-bit integer */;

  Online_Gifts_Variance_Last_YTD?: number /* 32-bit integer */ | null;

  Online_Gifts_Last_Year: number /* 32-bit integer */;

  /**
   * Max length: 102 characters
   */
  Giver_Notes: string /* max 102 chars */;

  Givers_YTD: number /* 32-bit integer */;

  Givers_Last_Year: number /* 32-bit integer */;

  /**
   * Max length: 171 characters
   */
  Comparison_Notes: string /* max 171 chars */;

  /**
   * Max length: 4000 characters
   */
  Date_Range_Before?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Date_Range_After?: string /* max 4000 chars */ | null;

  Giving_Before: number /* currency amount */;

  Giving_After: number /* currency amount */;

  Giving_After_Variance?: number /* currency amount */ | null;

  Gifts_Before: number /* 32-bit integer */;

  Gifts_After: number /* 32-bit integer */;

  Gifts_After_Variance?: number /* 32-bit integer */ | null;

  Online_Giving_Before: number /* currency amount */;

  Online_Giving_After: number /* currency amount */;

  Online_Giving_After_Variance?: number /* currency amount */ | null;

  Online_Gifts_Before: number /* 32-bit integer */;

  Online_Gifts_After: number /* 32-bit integer */;

  Online_Gifts_After_Variance?: number /* 32-bit integer */ | null;

  /**
   * Max length: 93 characters
   */
  HH_Member_Notes: string /* max 93 chars */;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* email, max 254 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Mobile_Phone?: string /* max 25 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Household_Position?: string /* max 25 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Gender?: string /* max 25 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Contact_Status: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Member_Status?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Participant_Type?: string /* max 50 chars */ | null;

  Age?: number /* 32-bit integer */ | null;

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 25 characters
   */
  Home_Phone?: string /* max 25 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 50 characters
   */
  Congregation_Name?: string /* max 50 chars */ | null;

  First_HH_Donation?: string /* ISO datetime */ | null;

  Last_HH_Donation?: string /* ISO datetime */ | null;

  Months_Since_Last_HH_Donation?: number /* 32-bit integer */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Spouse_Email?: string /* email, max 254 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Spouse_Mobile?: string /* max 25 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Spouse_HH_Position?: string /* max 25 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Spouse_Gender?: string /* max 25 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Contact_Status?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Member_Status?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Participant_Type?: string /* max 50 chars */ | null;

  Spouse_Age?: number /* 32-bit integer */ | null;
}

export type VwMpGivingUnitSummaryRecord = VwMpGivingUnitSummary;
