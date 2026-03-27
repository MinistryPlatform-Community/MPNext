export interface CommitmentImportRow {
  Contact_ID?: string;
  First_Name?: string;
  Last_Name?: string;
  Spouse_First?: string;
  Spouse_Last?: string;
  Spouse_Phone?: string;
  Spouse_Email_Address?: string;
  Spouse_Birthday?: string;
  Phone?: string;
  Email_Address?: string;
  Birthday?: string;
  Commitment_Date?: string;
  Previous_Annual_Giving?: string;
  Expanded_Annual_Giving?: string;
  Kickoff_Giving?: string;
  Step_Fearless?: string;
  Step_Above_and_Beyond?: string;
  Step_Tithing?: string;
  Step_Percentage?: string;
  Step_Consistent?: string;
  Contact_Me?: string;
  Include_Spouse_Giving?: string;
  Two_Year_Commitment?: string;
}

export interface CommitmentImportResult {
  total: number;
  succeeded: number;
  failed: { row: number; reason: string }[];
  warnings: { row: number; message: string }[];
}

export interface PledgeCampaignOption {
  Pledge_Campaign_ID: number;
  Campaign_Name: string;
}
