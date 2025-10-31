/**
 * Interface for Surge_Church_Plants
* Table: Surge_Church_Plants
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface SurgeChurchPlants {

  Surge_Church_Plant_ID: number /* 32-bit integer */; // Primary Key, Foreign Key -> Surge_Church_Plants.Surge_Church_Plant_ID

  Program_ID: number /* 32-bit integer */; // Foreign Key -> Programs.Program_ID

  Church_Plant_Cost: number /* currency amount */;

  Surge_Category_ID: number /* 32-bit integer */; // Foreign Key -> Surge_Categories.Surge_Category_ID, Has Default

  Strategic_Church_Plant: boolean; // Has Default

  Household_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Households.Household_ID

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Prayer_Partner_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  /**
   * Max length: 50 characters
   */
  External_Plant_Number?: string /* max 50 chars */ | null;

  Identity_Protected: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Church_Plant_Pastor?: string /* max 50 chars */ | null;

  Church_Plant_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Church_Plant_Partner?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 50 characters
   */
  City_or_Village?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  State_or_Region?: string /* max 50 chars */ | null;

  Country_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Countries.Country_ID

  Continent_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Continents.Continent_ID

  /**
   * Max length: 2000 characters
   */
  Church_Plant_Notes?: string /* max 2000 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Invoice_Number?: string /* max 50 chars */ | null;

  Invoice_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Check_Sent_to_Surge?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 50 characters
   */
  Check_Number?: string /* max 50 chars */ | null;

  Funded_Message?: number /* 32-bit integer */ | null; // Has Default

  Funded_Template: number /* 32-bit integer */; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID, Has Default

  Funded_Message_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  _Funded_Message_Sent: boolean; // Read Only, Has Default

  Certificate_Received_From_Surge?: string /* ISO date (YYYY-MM-DD) */ | null;

  Certificate_Sent_to_Donor: boolean; // Has Default

  Certificate_Message?: number /* 32-bit integer */ | null; // Has Default

  Certificate_Template: number /* 32-bit integer */; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID, Has Default

  Certificate_Message_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  _Certificate_Message_Sent: boolean; // Read Only, Has Default

  Placard_Number?: number /* 32-bit integer */ | null;

  /**
   * Max length: 5 characters
   */
  Placard_Chair?: string /* max 5 chars */ | null;

  Placard_Message?: number /* 32-bit integer */ | null; // Has Default

  Placard_Template: number /* 32-bit integer */; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID, Has Default

  Placard_Message_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  _Placard_Message_Sent: boolean; // Read Only, Has Default

  /**
   * Max length: 15 characters
   */
  Latitude?: string /* max 15 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Longitude?: string /* max 15 chars */ | null;

  /**
   * Max length: 100 characters
   */
  OLG_Surge_Subfund?: string /* max 100 chars */ | null;

  Church_Plant_Multiplier: number /* 32-bit integer */; // Has Default

  Parent_Church_Plant?: number /* 32-bit integer */ | null; // Foreign Key -> Surge_Church_Plants.Surge_Church_Plant_ID
}

export type SurgeChurchPlantsRecord = SurgeChurchPlants;
