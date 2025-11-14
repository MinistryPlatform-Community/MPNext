export interface ContactLogMadeBy {
  Contact_ID: number;
  First_Name: string;
  Last_Name: string;
  Nickname: string | null;
  Email_Address: string | null;
  Mobile_Phone: string | null;
  Image_GUID: string | null;
}

export interface ContactLogDisplay {
  Contact_Date: string;
  Contact_Log_ID: number;
  Contact_ID: number;
  Notes: string;
  Contact_Log_Type: string | null;
  Contact_Log_Type_ID: number | null;
  Made_By: number;
  MadeByContact?: ContactLogMadeBy[];
}
