/**
 * The signed-in user's own profile, as sent to the browser by
 * `getCurrentUserProfile` (src/components/shared-actions/user.ts).
 *
 * Only what the client renders: the header avatar and name, the user menu's
 * name and email, and the nav's `canAccessContactFeatures`. Anything returned
 * from a server action is readable by every script and extension on the page,
 * so identifiers (`User_ID`, `User_GUID`, `Contact_ID`), the phone number and
 * the user's roles and groups are deliberately NOT here
 * (security-client-data-overexposure, 2026-09-28). Add a field only when a
 * client component starts rendering it, and add it to the action's mapping —
 * the action builds this object key by key, never by spreading an MP row.
 */
export interface CurrentUserProfile {
  First_Name: string;
  Nickname: string;
  Last_Name: string;
  Email_Address: string | null;
  /** `dp_fileUniqueId` of the contact photo, for the header avatar. */
  Image_GUID: string | null;
  /**
   * Whether this user may use the contact-lookup / contact-log features,
   * computed SERVER-SIDE by `getCurrentUserProfile` from the same
   * `AuthorizationService` gate the pages, actions and services enforce with.
   *
   * UX only — the client uses it to hide navigation a role-less user would
   * only be refused at. It is NOT a security control. Consumers still test
   * `=== true` so a missing value fails closed.
   */
  canAccessContactFeatures: boolean;
}
