import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { MPHelper } from "@/lib/providers/ministry-platform";

/**
 * UserService - Singleton service for managing user-related operations
 * 
 * This service provides methods to interact with user data from Ministry Platform,
 * including retrieving user profiles and related contact information.
 */
export class UserService {
  private static instance: UserService;
  private mp: MPHelper | null = null;

  private constructor() {}

  /**
   * Returns a UserService instance.
   * @param accessToken Optional user access token from the OIDC session. When provided,
   *                    creates a per-request instance that authenticates as the logged-in
   *                    user (respecting their MP permissions and producing accurate audit logs).
   *                    When omitted, returns the singleton instance using client credentials.
   */
  public static async getInstance(accessToken?: string): Promise<UserService> {
    if (accessToken) {
      const instance = new UserService();
      instance.mp = new MPHelper({ accessToken });
      return instance;
    }
    if (!UserService.instance) {
      UserService.instance = new UserService();
      UserService.instance.mp = new MPHelper();
    }
    return UserService.instance;
  }

  /**
   * Retrieves a user profile by User GUID from Ministry Platform
   * 
   * Fetches user information including:
   * - User GUID
   * - Contact details (First Name, Nickname, Last Name)
   * - Email Address
   * - Mobile Phone
   * - Profile Image GUID
   * 
   * @param id - The User GUID to search for
   * @returns Promise<MPUserProfile> - The user profile data from Ministry Platform
   * @throws Will throw an error if the Ministry Platform query fails
   */
  public async getUserProfile(id: string): Promise<MPUserProfile> {
    const records = await this.mp!.getTableRecords<MPUserProfile>({
      table: "dp_Users",
      filter: `User_GUID = '${id}'`,
      select: "User_GUID, Contact_ID_TABLE.First_Name,Contact_ID_TABLE.Nickname,Contact_ID_TABLE.Last_Name,Contact_ID_TABLE.Email_Address,Contact_ID_TABLE.Mobile_Phone,Contact_ID_TABLE.dp_fileUniqueId AS Image_GUID",
      top: 1
    });
    
    // Return the first (and should be only) matching record
    return records[0];
  }
}