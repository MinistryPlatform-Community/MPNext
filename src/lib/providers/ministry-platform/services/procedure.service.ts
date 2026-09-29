import { MinistryPlatformClient } from "../client";
import { ProcedureInfo, QueryParams } from "../types";
import { errorName, sanitizeIdentifier } from "./guards";

/**
 * Stored procedures this app is allowed to execute.
 *
 * The service account can run any procedure MP exposes, including ones that
 * mutate data, so execution is refused for any name not listed here. The app
 * calls none today, so the list is empty and every execute call fails closed.
 * To enable one, add its exact name here in the same change that adds the
 * caller, so the reviewer sees both. (Listing procedures via `getProcedures`
 * is metadata only and is not gated.)
 */
export const ALLOWED_PROCEDURES: readonly string[] = [];

export interface ProcedureServiceOptions {
    /** Overrides {@link ALLOWED_PROCEDURES}. Intended for tests. */
    allowedProcedures?: Iterable<string>;
}

export class ProcedureService {
    private client: MinistryPlatformClient;
    private allowedProcedures: ReadonlySet<string>;

    constructor(client: MinistryPlatformClient, options?: ProcedureServiceOptions) {
        this.client = client;
        this.allowedProcedures = new Set(options?.allowedProcedures ?? ALLOWED_PROCEDURES);
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
            console.error('Error getting procedures:', errorName(error));
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
        const endpoint = this.procedureEndpoint(procedure);
        try {
            await this.client.ensureValidToken();

            const data = await this.client.getHttpClient().get<unknown[][]>(endpoint, params);

            return data;
        } catch (error) {
            console.error(`Error executing procedure ${procedure}:`, errorName(error));
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
        const endpoint = this.procedureEndpoint(procedure);
        try {
            await this.client.ensureValidToken();

            const data = await this.client.getHttpClient().post<unknown[][]>(endpoint, parameters);

            return data;
        } catch (error) {
            console.error(`Error executing procedure ${procedure}:`, errorName(error));
            throw error;
        }
    }

    /**
     * `/procs/{name}` for a name that is a plain identifier AND on the
     * allowlist. Throws before any token or network work; neither message
     * echoes the input.
     */
    private procedureEndpoint(procedure: unknown): string {
        const name = sanitizeIdentifier(procedure, 'procedure name');
        if (!this.allowedProcedures.has(name)) {
            throw new Error('Procedure is not on the allowlist');
        }
        return `/procs/${encodeURIComponent(name)}`;
    }
}
