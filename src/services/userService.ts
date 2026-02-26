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
  public async getUserProfile(id: string): Promise<MPUserProfile | undefined> {
    const records = await this.mp!.getTableRecords<MPUserProfile>({
      table: "dp_Users",
      filter: `User_GUID = '${id}'`,
      select: "User_ID, User_GUID, Contact_ID_TABLE.First_Name,Contact_ID_TABLE.Nickname,Contact_ID_TABLE.Last_Name,Contact_ID_TABLE.Email_Address,Contact_ID_TABLE.Mobile_Phone,Contact_ID_TABLE.dp_fileUniqueId AS Image_GUID",
      top: 1
    });

    const profile = records[0];
    if (!profile) return undefined;

    const [roleRecords, groupRecords] = await Promise.all([
      this.mp!.getTableRecords<{ Role_Name: string }>({
        table: "dp_User_Roles",
        filter: `User_ID = ${profile.User_ID}`,
        select: "Role_ID_TABLE.Role_Name",
      }),
      this.mp!.getTableRecords<{ User_Group_Name: string }>({
        table: "dp_User_User_Groups",
        filter: `User_ID = ${profile.User_ID}`,
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