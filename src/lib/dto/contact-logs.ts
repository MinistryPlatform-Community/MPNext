export interface ContactLogMadeBy {
  Contact_ID: number;
  First_Name: string;
  Last_Name: string;
  Nickname: string | null;
  Email_Address: string | null;
  Mobile_Phone: string | null;
  Image_GUID: string | null;
}

/**
 * One contact log as the contact-log list renders it — and nothing more.
 *
 * Everything in this object is sent to the browser, where any script or
 * extension on the page can read it, so it carries only what
 * `ContactLogs` displays or keys on: the ID (row key, edit/delete target), the
 * date, the notes and the type name (badge, and the edit form's selection).
 * Author IDs (`Made_By`), the subject `Contact_ID`, `Contact_Log_Type_ID` and
 * the cross-record links on the MP row are deliberately left out (2026-09-28
 * review). Build it field by field — never by spreading an MP row into it.
 */
export interface ContactLogDisplay {
  Contact_Date: string;
  Contact_Log_ID: number;
  Notes: string;
  Contact_Log_Type: string | null;
  MadeByContact?: ContactLogMadeBy[];
}
