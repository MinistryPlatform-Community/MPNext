import "server-only";
import { QueryParams, RequestBody } from "../types/provider.types";

// Deadline for a JSON API call. Without one a stalled MP holds the request
// until undici's 300 s default, and resolveMpUserId (inside every getSession)
// would stall every page with it.
export const API_TIMEOUT_MS = 20_000;

// Multipart uploads carry file bodies, so they get a longer deadline.
export const UPLOAD_TIMEOUT_MS = 60_000;

// Endpoint content that could re-aim the service bearer at another API path
// once the URL parser runs: dot-segments, a query/fragment smuggled into the
// path, backslashes (treated as "/" for http(s)), their percent-encoded forms,
// and control characters (the parser silently strips tabs/newlines, so ".\t."
// would become "..").
const UNSAFE_ENDPOINT = /\.\.|[?#\\]|%2e|%2f|%5c|[\u0000-\u001f\u007f]/i;

// MP file unique IDs are GUIDs, and MP serves /files/{uniqueId} without
// authentication, so the ID is a download capability: keep it out of logs and
// error messages.
const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const UNSAFE_ENDPOINT_MESSAGE = 'Refusing unsafe MP API endpoint';

/** An endpoint safe to put in a log line or error message. */
export function redactEndpoint(endpoint: string): string {
    return endpoint.replace(GUID, '{uniqueId}');
}

/** Error name only — never the message, which can embed a body fragment. */
export function errorName(error: unknown): string {
    const name = (error as { name?: unknown } | null)?.name;
    return typeof name === 'string' && name ? name : typeof error;
}

/**
 * Parses a successful response as JSON without letting a non-JSON body leak
 * into an error: V8's SyntaxError message embeds a fragment of the input, and
 * callers log errors. An empty body (204, or Content-Length: 0) yields
 * undefined.
 *
 * @param label prefix for thrown messages, e.g. "GET /tables/Contacts failed"
 */
export async function readJsonResponse<T>(response: Response, label: string): Promise<T> {
    const headers = response.headers;
    if (response.status === 204 || headers?.get('content-length') === '0') {
        return undefined as T;
    }

    const contentType = (headers?.get('content-type') ?? '').trim().toLowerCase();
    if (!/^application\/([\w.-]+\+)?json(\s*;|$)/.test(contentType)) {
        throw new Error(`${label}: unexpected content-type`);
    }

    try {
        return (await response.json()) as T;
    } catch {
        throw new Error(`${label}: invalid JSON response`);
    }
}

/**
 * Called on a 401 with the token that was rejected. Expected to invalidate it
 * (if it is still current) and obtain a fresh one; the request is then retried
 * once.
 */
export type UnauthorizedHandler = (rejectedToken: string) => Promise<void>;

interface RequestOptions {
    queryParams?: QueryParams;
    body?: BodyInit;
    json?: boolean;
    timeoutMs?: number;
}

export class HttpClient {
    private baseUrl: string;
    private getToken: () => string;
    private onUnauthorized?: UnauthorizedHandler;

    constructor(baseUrl: string, getToken: () => string, onUnauthorized?: UnauthorizedHandler) {
        this.baseUrl = baseUrl;
        this.getToken = getToken;
        this.onUnauthorized = onUnauthorized;
    }

    async get<T = unknown>(endpoint: string, queryParams?: QueryParams): Promise<T> {
        return this.request<T>('GET', endpoint, { queryParams });
    }

    async post<T = unknown>(endpoint: string, body?: RequestBody, queryParams?: QueryParams): Promise<T> {
        return this.request<T>('POST', endpoint, {
            queryParams,
            body: body ? JSON.stringify(body) : undefined,
            json: true
        });
    }

    async postFormData<T = unknown>(endpoint: string, formData: FormData, queryParams?: QueryParams): Promise<T> {
        return this.request<T>('POST', endpoint, {
            queryParams,
            body: formData,
            timeoutMs: UPLOAD_TIMEOUT_MS
        });
    }

    async put<T = unknown>(endpoint: string, body: RequestBody, queryParams?: QueryParams): Promise<T> {
        return this.request<T>('PUT', endpoint, {
            queryParams,
            body: JSON.stringify(body),
            json: true
        });
    }

    async putFormData<T = unknown>(endpoint: string, formData: FormData, queryParams?: QueryParams): Promise<T> {
        return this.request<T>('PUT', endpoint, {
            queryParams,
            body: formData,
            timeoutMs: UPLOAD_TIMEOUT_MS
        });
    }

    async delete<T = unknown>(endpoint: string, queryParams?: QueryParams): Promise<T> {
        return this.request<T>('DELETE', endpoint, { queryParams });
    }

    public buildUrl(endpoint: string, queryParams?: QueryParams): string {
        this.assertSafeEndpoint(endpoint);
        const url = `${this.baseUrl}${endpoint}`;
        if (!queryParams) return url;

        const queryString = this.buildQueryString(queryParams);
        return queryString ? `${url}?${queryString}` : url;
    }

    /**
     * Central path guard. The endpoint is appended to the service account's
     * base URL and sent with its bearer, so it must not be able to leave the
     * API root or reach a different API path than the one it names. Table and
     * procedure names are encodeURIComponent'd by callers, but
     * encodeURIComponent("..") === "..", so the check has to live here.
     */
    private assertSafeEndpoint(endpoint: string): void {
        // Runtime check: types are erased, and endpoints can carry caller input.
        if (typeof endpoint !== 'string' || !endpoint.startsWith('/') || UNSAFE_ENDPOINT.test(endpoint)) {
            throw new Error(UNSAFE_ENDPOINT_MESSAGE);
        }

        let resolved: string;
        let root: string;
        try {
            root = new URL(this.baseUrl).href.replace(/\/+$/, '') + '/';
            resolved = new URL(`${this.baseUrl}${endpoint}`).href;
        } catch {
            throw new Error('Invalid MP API base URL');
        }
        // Defensive: the checks above already rule out every known way out.
        if (!resolved.startsWith(root)) {
            throw new Error(UNSAFE_ENDPOINT_MESSAGE);
        }
    }

    private buildQueryString(params: QueryParams): string {
        return Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => {
                const k = encodeQueryKey(key);
                if (Array.isArray(value)) {
                    return value.map(v => `${k}=${encodeURIComponent(String(v))}`).join('&');
                }
                return `${k}=${encodeURIComponent(String(value))}`;
            })
            .join('&');
    }

    private async request<T>(method: string, endpoint: string, options: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options.queryParams);
        const safeEndpoint = redactEndpoint(endpoint);

        let token = this.getToken();
        let response = await this.send(method, url, safeEndpoint, token, options);

        if (response.status === 401 && this.onUnauthorized) {
            // The token may have been revoked server-side before its local
            // expiry: drop it, fetch a new one, and retry exactly once. A
            // failed refresh falls through to the ordinary 401 error below.
            let refreshed = false;
            try {
                await this.onUnauthorized(token);
                refreshed = true;
            } catch (error) {
                console.error('MP token refresh after 401 failed:', {
                    method,
                    endpoint: safeEndpoint,
                    error: errorName(error)
                });
            }
            if (refreshed) {
                token = this.getToken();
                response = await this.send(method, url, safeEndpoint, token, options);
            }
        }

        if (!response.ok) {
            console.error(`${method} Request failed:`, {
                method,
                endpoint: safeEndpoint,
                status: response.status,
                statusText: response.statusText
            });
            throw new Error(`${method} ${safeEndpoint} failed: ${response.status} ${response.statusText}`);
        }

        return readJsonResponse<T>(response, `${method} ${safeEndpoint} failed`);
    }

    private async send(
        method: string,
        url: string,
        safeEndpoint: string,
        token: string,
        options: RequestOptions
    ): Promise<Response> {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        // Don't set Content-Type for FormData — fetch adds the boundary.
        if (options.json) headers['Content-Type'] = 'application/json';

        const init: RequestInit = {
            method,
            headers,
            // The MP API has no legitimate redirects, and a 307/308 would
            // re-send the body (member data) to wherever it points.
            redirect: 'error',
            // A fresh signal per attempt, so a 401 retry gets its own deadline.
            signal: AbortSignal.timeout(options.timeoutMs ?? API_TIMEOUT_MS)
        };
        if (method === 'POST' || method === 'PUT') init.body = options.body;

        try {
            return await fetch(url, init);
        } catch (error) {
            // Network error, timeout, or refused redirect. Log the name only —
            // never the URL (it carries the $filter) or the raw error.
            const name = errorName(error);
            console.error(`${method} Request failed:`, { method, endpoint: safeEndpoint, error: name });
            throw new Error(`${method} ${safeEndpoint} failed: ${name}`);
        }
    }
}

// Query keys are caller-shaped too. "$" (MP's $filter/$top/...) and "@"
// (stored-procedure parameters) are legal in a query component and MP expects
// them literally, so they are left unescaped.
function encodeQueryKey(key: string): string {
    return encodeURIComponent(key).replace(/%24/g, '$').replace(/%40/g, '@');
}
