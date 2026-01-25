/**
 * Interface for Response_Results
* Table: Response_Results
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ResponseResults {

  Response_Result_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Response_Result: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type ResponseResultsRecord = ResponseResults;
