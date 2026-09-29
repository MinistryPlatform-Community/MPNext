import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { sanitizeGuid, sanitizeNumericId } from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import { UnauthorizedError } from "@/services/authorizationService";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * UserService - Singleton service for managing user-related operations
 * 
 * This service provides methods to interact with user data from Ministry Platform,
 * including retrieving user profiles and related contact information.
 */
export class UserService {
  private static instance: UserService;
  private mp: MPHelper | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the service when instantiated
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Gets the singleton instance of UserService
   * Creates a new instance if one doesn't exist and ensures it's properly initialized
   * 
   * @returns Promise<UserService> - The initialized UserService instance
   */
  public static async getInstance(): Promise<UserService> {
    if (!UserService.instance) {
      UserService.instance = new UserService();
      await UserService.instance.initialize();
    }
    return UserService.instance;
  }

  /**
   * Initializes the UserService by creating a new MPHelper instance
   * This method sets up the Ministry Platform connection helper
   * 
   * @returns Promise<void>
   */
  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  /**
   * Retrieves the SIGNED-IN user's own profile from Ministry Platform
   *
   * Fetches user information including:
   * - User GUID
   * - Contact details (First Name, Nickname, Last Name)
   * - Email Address
   * - Mobile Phone
   * - Profile Image GUID
   * - The user's MP security roles and user groups
   *
   * ## Authorization — own profile only
   *
   * This method is self-protecting rather than trusting its caller (2026-09-28
   * review; same shape as F10). It reads the session itself and refuses any
   * `id` other than the session's own `userGuid`, so a future caller that
   * passes a GUID from a URL or form cannot read another user's PII and
   * authorization model. That is also why it needs no MP security role: the
   * one thing it can return is the caller's own profile, which every signed-in
   * user must be able to load (avatar, name, sign-out). The documented
   * session-only carve-out for `getCurrentUserProfile` rests on this. A
   * feature that ever needs another user's profile needs a separate,
   * role-gated method.
   *
   * @param id - The User GUID to search for; must be the session user's own
   * @returns Promise<MPUserProfile> - The user profile data from Ministry Platform
   * @throws UnauthorizedError when there is no session, or `id` is not the
   *   session user's own `userGuid`
   * @throws Will throw an error if the Ministry Platform query fails
   */
  public async getUserProfile(id: string): Promise<MPUserProfile | undefined> {
    const session = await auth.api.getSession({ headers: await headers() });
    const sessionGuid = (session?.user as { userGuid?: unknown } | undefined)?.userGuid;
    if (!session?.user?.id || typeof sessionGuid !== "string" || !sessionGuid) {
      throw new UnauthorizedError("Not authorized: a signed-in session is required to read a user profile");
    }

    const guid = sanitizeGuid(id);
    // GUIDs compare case-insensitively; MP and the OIDC `sub` may differ in case.
    if (guid.toLowerCase() !== sessionGuid.toLowerCase()) {
      throw new UnauthorizedError("Not authorized: a user profile may only be read by its own user");
    }

    const records = await this.mp!.getTableRecords<MPUserProfile>({
      table: "dp_Users",
      filter: `User_GUID = '${guid}'`,
      select: "User_ID, User_GUID, Contact_ID_TABLE.First_Name,Contact_ID_TABLE.Nickname,Contact_ID_TABLE.Last_Name,Contact_ID_TABLE.Email_Address,Contact_ID_TABLE.Mobile_Phone,Contact_ID_TABLE.dp_fileUniqueId AS Image_GUID",
      top: 1
    });

    const profile = records[0];
    if (!profile) return undefined;

    // Sanitized even though the value originates from MP, so that no filter string
    // in this file is built from an unvalidated value.
    const userId = sanitizeNumericId(profile.User_ID, "User ID");

    const [roleRecords, groupRecords] = await Promise.all([
      this.mp!.getTableRecords<{ Role_Name: string }>({
        table: "dp_User_Roles",
        filter: `User_ID = ${userId}`,
        select: "Role_ID_TABLE.Role_Name",
      }),
      this.mp!.getTableRecords<{ User_Group_Name: string }>({
        table: "dp_User_User_Groups",
        filter: `User_ID = ${userId}`,
        select: "User_Group_ID_TABLE.User_Group_Name",
      }),
    ]);

    return {
      ...profile,
      roles: roleRecords.map((r) => r.Role_Name),
      userGroups: groupRecords.map((g) => g.User_Group_Name),
    };
  }
}