/**
 * Longest contact-search term accepted, in characters (after trimming).
 *
 * Enforced server-side by `searchContacts` and `ContactService.contactSearch`
 * (the term is interpolated into five `LIKE '%…%'` clauses, so an uncapped term
 * becomes a multi-megabyte URL) and mirrored as the input's `maxLength` so a
 * legitimate user never meets the server error. No real name, email address or
 * phone number comes close.
 */
export const CONTACT_SEARCH_MAX_LENGTH = 100;

export interface ContactSearch {
  Contact_ID: number;
  Contact_GUID: string;
  First_Name: string;
  Nickname: string;
  Last_Name: string;
  Email_Address: string;
  Mobile_Phone: string;
  Image_GUID: string;
}

export interface ContactLookupDetails {
  Contact_ID: number;
  Contact_GUID: string;
  First_Name: string;
  Nickname: string;
  Last_Name: string;
  Email_Address: string;
  Mobile_Phone: string;
  Image_GUID: string;
}
