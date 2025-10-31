import { DpConfigurationSettings } from "@/lib/providers/ministry-platform/models/DpConfigurationSettings";
import { MPHelper } from "@/lib/providers/ministry-platform";

/**
 * ConfigurationService - Singleton service for managing configuration settings operations
 * 
 * This service provides methods to interact with configuration settings data from Ministry Platform.
 * Uses the singleton pattern to ensure a single instance across the application.
 */
export class ConfigurationService {
  private static instance: ConfigurationService;
  private mp: MPHelper | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the service when instantiated
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Gets the singleton instance of ConfigurationService
   * Creates a new instance if one doesn't exist and ensures it's properly initialized
   * 
   * @returns Promise<ConfigurationService> - The initialized ConfigurationService instance
   */
  public static async getInstance(): Promise<ConfigurationService> {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
      await ConfigurationService.instance.initialize();
    }
    return ConfigurationService.instance;
  }

  /**
   * Initializes the ConfigurationService by creating a new MPHelper instance
   * This method sets up the Ministry Platform connection helper
   * 
   * @returns Promise<void>
   */
  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  /**
   * Retrieves a configuration setting record by application code and key name
   * 
   * @param applicationCode - The application code to filter by
   * @param keyName - The key name to filter by
   * @returns Promise<DpConfigurationSettings | null> - The matching configuration setting record or null if not found
   */
  public async getConfigurationSetting(applicationCode: string, keyName: string): Promise<DpConfigurationSettings | null> {
    const records = await this.mp!.getTableRecords<DpConfigurationSettings>({
      table: "dp_Configuration_Settings",
      filter: `Application_Code = '${applicationCode}' AND Key_Name = '${keyName}'`,
      top: 1
    });
    
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Retrieves a configuration value by application code and key name, converted to the specified type
   * 
   * @param applicationCode - The application code to filter by
   * @param keyName - The key name to filter by
   * @returns Promise<T | null> - The configuration value converted to type T, or null if not found or value is null
   * 
   * @example
   * const stringValue = await service.getConfigurationValue<string>('APP', 'KEY');
   * const intValue = await service.getConfigurationValue<number>('APP', 'KEY');
   * const boolValue = await service.getConfigurationValue<boolean>('APP', 'KEY');
   */
  public async getConfigurationValue<T extends string | number | boolean>(applicationCode: string, keyName: string): Promise<T | null> {
    const setting = await this.getConfigurationSetting(applicationCode, keyName);
    
    if (!setting || setting.Value === null || setting.Value === undefined) {
      return null;
    }

    const value: string = setting.Value;
    const lowerValue = value.toLowerCase().trim();
    
    if (lowerValue === 'true' || lowerValue === 'false') {
      return (lowerValue === 'true') as T;
    }

    const numValue = Number(value);
    if (!isNaN(numValue)) {
      if (value.includes('.')) {
        return numValue as T;
      }
      return parseInt(value, 10) as T;
    }

    return value as T;
  }
}
