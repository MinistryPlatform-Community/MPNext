import { MinistryPlatformClient } from "../client";
import { TableQueryParams, TableRecord, QueryParams } from "../types";
import { sanitizeNumericId } from "../utils/filter-sanitize";
import { errorName, sanitizeIdentifier } from "./guards";

/**
 * `/tables/{table}` for a validated table name. `encodeURIComponent` alone is
 * not enough: it leaves `..` intact, which the URL parser then resolves to the
 * API root. Throws before any token or network work, without echoing the input.
 */
function tableEndpoint(table: unknown): string {
    return `/tables/${encodeURIComponent(sanitizeIdentifier(table, 'table name'))}`;
}

export class TableService {
    private client: MinistryPlatformClient;

    constructor(client: MinistryPlatformClient) {
        this.client = client;
    }

    /**
     * Returns the list of records from the specified table satisfying the provided search criteria.
     */
        public async getTableRecords<T>(table: string, params?: TableQueryParams): Promise<T[]> {
            const endpoint = tableEndpoint(table);
            try {
                await this.client.ensureValidToken();

                const data = await this.client.getHttpClient().get<T[]>(endpoint, params as QueryParams);

                return data;
            } catch (error) {
                console.error(`Error fetching records from table ${table}:`, errorName(error));
                throw error;
            }
        }

    /**
     * Creates new records in the specified table.
     */
    public async createTableRecords<T extends TableRecord = TableRecord>(
        table: string,
        records: T[],
        params?: Pick<TableQueryParams, '$select' | '$userId'>
    ): Promise<T[]> {
        const endpoint = tableEndpoint(table);
        try {
            await this.client.ensureValidToken();

            const result = await this.client.getHttpClient().post<T[]>(endpoint, records as unknown as Record<string, unknown>, params);
            return result;
        } catch (error) {
            console.error(`Error creating records in table ${table}:`, errorName(error));
            throw error;
        }
    }
    /**
     * Updates provided records in the specified table.
     */
    public async updateTableRecords<T extends TableRecord = TableRecord>(
        table: string,
        records: T[],
        params?: Pick<TableQueryParams, '$select' | '$userId' | '$allowCreate'>
    ): Promise<T[]> {
        const endpoint = tableEndpoint(table);
        try {
            await this.client.ensureValidToken();

            const result = await this.client.getHttpClient().put<T[]>(endpoint, records as unknown as Record<string, unknown>, params);
            return result;
        } catch (error) {
            console.error(`Error updating records in table ${table}:`, errorName(error));
            throw error;
        }
    }
    /**
     * Deletes multiple records from the specified table.
     */
    public async deleteTableRecords<T extends TableRecord = TableRecord>(
        table: string,
        ids: number[],
        params?: Pick<TableQueryParams, '$select' | '$userId'>
    ): Promise<T[]> {
        const endpoint = tableEndpoint(table);
        // Each id becomes an `id=` query value; a non-integer here would be a
        // malformed delete at best, so refuse it before anything is sent.
        if (!Array.isArray(ids)) {
            throw new Error('Invalid record IDs');
        }
        const safeIds = ids.map((id) => sanitizeNumericId(id, 'record ID'));
        try {
            await this.client.ensureValidToken();

            // Combine the ids and other params
            const queryParams = { ...params, id: safeIds };

            const result = await this.client.getHttpClient().delete<T[]>(endpoint, queryParams);
            return result;
        } catch (error) {
            console.error(`Error deleting records from table ${table}:`, errorName(error));
            throw error;
        }
    }
}
