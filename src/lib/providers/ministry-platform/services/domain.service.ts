import { MinistryPlatformClient } from "../client";
import { DomainInfo, GlobalFilterItem, GlobalFilterParams, QueryParams } from "../types";
import { sanitizeNumericId } from "../utils/filter-sanitize";
import { errorName } from "./guards";

export class DomainService {
    private client: MinistryPlatformClient;

    constructor(client: MinistryPlatformClient) {
        this.client = client;
    }

    /**
     * Returns the basic information about the current domain.
     * @returns Promise with the domain information
     */
    public async getDomainInfo(): Promise<DomainInfo> {
        try {
            await this.client.ensureValidToken();
            return await this.client.getHttpClient().get('/domain');
        } catch (error) {
            console.error('Error getting domain info:', errorName(error));
            throw error;
        }
    }

    /**
     * Returns the lookup values to be used as global filters. The key corresponds to
     * an identifier and the value corresponds to a friendly name (description). Zero (0)
     * identifier corresponds to records with not assigned filters.
     *
     * Only `$userId` is forwarded. `$ignorePermissions` is deliberately dropped:
     * the request already runs as the admin-level service account, and nothing
     * in the app needs MP to widen that further. A caller that does must make
     * the case for it in review, not get it by passing a flag through.
     *
     * @param params Optional parameters for the global filters request
     * @returns Promise with an array of global filter items
     */
    public async getGlobalFilters(params?: GlobalFilterParams): Promise<GlobalFilterItem[]> {
        const query: QueryParams = {};
        if (params?.$userId !== undefined) {
            query.$userId = sanitizeNumericId(params.$userId, 'user ID');
        }
        try {
            await this.client.ensureValidToken();
            return await this.client.getHttpClient().get('/domain/filters', query);
        } catch (error) {
            console.error('Error getting global filters:', errorName(error));
            throw error;
        }
    }
}
