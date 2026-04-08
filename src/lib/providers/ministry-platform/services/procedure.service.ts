import { MinistryPlatformClient } from "../client";
import { ProcedureInfo, QueryParams } from "../types";

export class ProcedureService {
    private client: MinistryPlatformClient;

    constructor(client: MinistryPlatformClient) {
        this.client = client;
    }

    /**
     * Returns the list of procedures available to the current user with basic metadata.
     */
    public async getProcedures(search?: string): Promise<ProcedureInfo[]> {
        try {
            await this.client.ensureValidToken();

            const params: QueryParams | undefined = search ? { $search: search } : undefined;
            return await this.client.getHttpClient().get<ProcedureInfo[]>('/procs', params);
        } catch (error) {
            console.error('Error getting procedures:', error);
            throw error;
        }
    }

    /**
     * Executes the requested stored procedure retrieving parameters from the query string.
     */
    public async executeProcedure(
        procedure: string, 
        params?: QueryParams
    ): Promise<unknown[][]> {
        try {
            await this.client.ensureValidToken();

            const endpoint = `/procs/${encodeURIComponent(procedure)}`;
            const data = await this.client.getHttpClient().get<unknown[][]>(endpoint, params);

            return data;
        } catch (error) {
            console.error(`Error executing procedure ${procedure}:`, error);
            throw error;
        }
    }

    /**
     * Executes the requested stored procedure with provided parameters in the request body.
     */
    public async executeProcedureWithBody(
        procedure: string, 
        parameters: Record<string, unknown>
    ): Promise<unknown[][]> {
        try {
            await this.client.ensureValidToken();

            const endpoint = `/procs/${encodeURIComponent(procedure)}`;
            const data = await this.client.getHttpClient().post<unknown[][]>(endpoint, parameters);

            return data;
        } catch (error) {
            console.error(`Error executing procedure ${procedure}:`, error);
            throw error;
        }
    }
}