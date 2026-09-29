import { cache } from "react";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { sanitizeNumericId } from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import { SessionContextService } from "@/services/sessionContextService";

/**
 * Thrown when the acting user is authenticated but not permitted to perform
 * the requested Ministry Platform operation.
 *
 * Distinct from the generic `Error` the actions throw for authentication and
 * argument problems so callers (and tests) can tell "you are not signed in"
 * apart from "you are signed in but may not do this".
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** The MP operations this gate distinguishes. `read` is gated as of F1. */
export type MpOperation = "read" | "create" | "update" | "delete";

/**
 * Why a request was refused. Stable strings — logs and alerts grep on them.
 *
 * `roles_not_configured` means the app itself has no usable role policy
 * (`MP_SECURITY_ROLES` and its legacy fallback are unset, blank, or parse to no
 * role names) — every user is refused until an operator sets one.
 */
export type DenialReason =
  | "no_mp_user"
  | "no_security_role"
  | "role_not_permitted"
  | "roles_not_configured";

export interface AuthorizationContext {
  table: string;
  operation: MpOperation;
}

export interface AuthorizationDecision {
  /** True when the acting user may perform `operation` on `table`. */
  permitted: boolean;
  /** The acting MP `User_ID`, or null when none could be resolved. */
  userId: number | null;
  /** Null when permitted; otherwise why the request was refused. */
  reason: DenialReason | null;
}

/**
 * Env var naming the MP security roles permitted to perform gated operations,
 * comma-separated (e.g. `MP_SECURITY_ROLES="Administrators,Pastoral Staff"`).
 *
 * The gate FAILS CLOSED: unset, blank, or a value that parses to no role names
 * (e.g. `","`) permits nobody. `MP_SECURITY_ROLES=*` is the explicit opt-in to
 * "any MP security role will do" — the pre-2026-09-28 default, which is now
 * something an operator has to choose rather than inherit.
 */
const SECURITY_ROLES_ENV = "MP_SECURITY_ROLES";

/**
 * Deprecated predecessor of {@link SECURITY_ROLES_ENV}, read only when the
 * general var yields no usable policy (unset, blank, or no role names). It
 * restricted writes only; the policy now covers reads too, so the name no
 * longer describes what it does. Deployments that still set it keep working.
 */
const LEGACY_SECURITY_ROLES_ENV = "MP_WRITE_SECURITY_ROLES";

/** The whole-value wildcard meaning "any MP security role". */
const ANY_ROLE = "*";

/**
 * The effective role policy.
 *
 * - `any`: holding at least one MP security role is sufficient (`*`).
 * - `list`: the user must hold one of `names` (normalized).
 * - `unconfigured`: no usable policy — nobody is permitted.
 */
export type RolePolicy =
  | { kind: "any" }
  | { kind: "list"; names: string[] }
  | { kind: "unconfigured" };

type ParsedRoleValue =
  | { kind: "any" }
  | { kind: "list"; names: string[] }
  /** Unset or whitespace-only. */
  | { kind: "blank" }
  /** Non-blank but no role names survive parsing, e.g. `","`. */
  | { kind: "no_names" };

function normalizeRoleName(role: string): string {
  return role.trim().toLowerCase();
}

/**
 * Parses one env value. `*` means "any role" only as the WHOLE value; inside a
 * list it is just a (non-matching) name, so `"Administrators,*"` does not widen
 * the gate.
 */
function parseRoleValue(raw: string | undefined): ParsedRoleValue {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return { kind: "blank" };
  if (trimmed === ANY_ROLE) return { kind: "any" };
  const names = trimmed
    .split(",")
    .map(normalizeRoleName)
    .filter((r) => r.length > 0);
  return names.length > 0 ? { kind: "list", names } : { kind: "no_names" };
}

/**
 * AuthorizationService — decides whether the acting user may read from or
 * write to Ministry Platform through this app.
 *
 * Policy (extended to reads 2026-09-12, closing F1; writes decided 2026-08-21 —
 * see `.claude/references/auth.md`; default made fail-closed 2026-09-28): an
 * authenticated user who holds one of the MP security roles named in
 * `MP_SECURITY_ROLES` (or any role, when it is `*`) may use the contact
 * features. With no roles configured nobody may. A user without a permitted
 * role may sign in and see the app shell but may neither read nor write
 * contact data.
 * MP security roles are the domain's own authorization mechanism, so this app
 * defers to them rather than inventing a parallel one. Ownership (`Made_By`)
 * is deliberately NOT a factor: staff need to be able to correct and remove
 * each other's logs.
 *
 * Why reads need a gate at all: MP's OIDC endpoint authenticates ANY
 * `dp_Users` record, and this app fetches all MP data with its own
 * client-credentials service account (`dataplatform/scopes/all`), so MP's
 * per-user record security never applies to what we return. Authentication
 * alone is therefore not sufficient for a read either.
 *
 * The gate fails closed: a session whose MP `User_ID` never resolved is
 * refused, as is one whose role list cannot be established.
 */
export class AuthorizationService {
  private static instance: AuthorizationService | null = null;
  private mp: MPHelper | null = null;

  private constructor() {}

  /**
   * Lazily creates the MP helper. Kept out of the constructor so importing
   * this module never touches the MP provider (or its env vars) — the
   * module-level singleton below is created at import time.
   */
  private helper(): MPHelper {
    if (!this.mp) {
      this.mp = new MPHelper();
    }
    return this.mp;
  }

  public static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  /**
   * Per-REQUEST memoization of the `dp_User_Roles` read, keyed by `User_ID`.
   *
   * The gate runs at up to three layers per request (page/layout, server
   * action, service method), and each layer must be able to call it without
   * knowing whether another already did. React's `cache()` scopes the memo to a
   * single React server render, so during an RSC render (a page or layout and
   * the services it calls) those calls cost one MP read — and nothing is
   * carried across requests, which is what keeps a revoked role effective on
   * the user's very next request.
   *
   * It does NOT dedupe inside a server action. Next runs an action outside a
   * React render, where `cache()` has no dispatcher and calls straight through,
   * so an action that gates and then calls a gated service method reads the
   * roles once per gate call. That costs an extra MP read, never a wrong
   * answer.
   *
   * Outside a React request scope (Vitest, a plain Node script) `cache()` is
   * likewise a passthrough, which is why the "does not cache across calls"
   * assertions in the tests hold.
   *
   * This is deliberately NOT a module-level or time-based cache. See
   * `.claude/references/auth.md` § Authorization.
   */
  private static readonly loadSecurityRoles = cache(
    async (userId: number): Promise<string[]> =>
      AuthorizationService.getInstance().readSecurityRolesFromMp(userId),
  );

  /**
   * Reads the MP security role names held by a user, bypassing the per-request
   * memo. Private: the only entry point is {@link getSecurityRoles}, which
   * validates the ID and fails closed. The ID is sanitized here as well, so the
   * interpolation below is safe on its own rather than because of its caller.
   */
  private async readSecurityRolesFromMp(userId: number): Promise<string[]> {
    const records = await this.helper().getTableRecords<{ Role_Name: string | null }>({
      table: "dp_User_Roles",
      filter: `User_ID = ${sanitizeNumericId(userId, "acting MP User_ID")}`,
      select: "Role_ID_TABLE.Role_Name",
    });

    return (records ?? [])
      .map((r) => r.Role_Name)
      .filter((name): name is string => Boolean(name && name.trim()));
  }

  /**
   * Returns the MP security role names held by a user, memoized per request.
   *
   * @param userId - MP `User_ID` (must be a positive integer)
   * @returns Role names from `dp_User_Roles`; empty when the user holds none
   */
  public async getSecurityRoles(userId: number): Promise<string[]> {
    // `sanitizeNumericId` is the single source of truth for the numeric-ID rule
    // (see filter-sanitize.ts) and guards the interpolation below. Its plain
    // Error is re-thrown as UnauthorizedError: an unusable acting User_ID means
    // we cannot establish permission, so it must fail closed as an authz denial
    // rather than surface as a generic validation error. Validated BEFORE the
    // memo so a bad ID can never be cached as a key.
    let safeUserId: number;
    try {
      safeUserId = sanitizeNumericId(userId, "acting MP User_ID");
    } catch {
      throw new UnauthorizedError(
        "Not authorized: acting MP User_ID is not a valid identifier",
      );
    }

    return AuthorizationService.loadSecurityRoles(safeUserId);
  }

  /**
   * Non-throwing form of the gate. Returns the decision and the acting user's
   * MP `User_ID` without logging a denial — use it to compute UI affordances
   * (e.g. `canAccessContactFeatures`), never as the enforcement point.
   *
   * A failed `dp_User_Roles` read and an unusable acting `User_ID` are thrown
   * rather than reported as `permitted: false`, so for those a caller cannot
   * mistake "MP is down" for "this user is not allowed".
   *
   * Known gap (2026-09-28 review, behaviour unchanged): a failure one step
   * earlier is NOT distinguished. When the session lookup throws, or the MP
   * `User_ID` could not be resolved at sign-in because MP was unreachable
   * (`resolveMpUserId` in `src/lib/auth.ts` returns null, and caches that
   * null for 30 s — 5 min for "no such user"), `SessionContextService` yields
   * null and this reports `no_mp_user` — so the user sees "no access" rather
   * than an error until the cache entry lapses. It still fails closed.
   */
  public async hasSecurityRole(
    ctx: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    const sessions = SessionContextService.getInstance();

    // Writes go through `getActingUserIdForWrite` so an unattributed write
    // still emits the structured `mp.write.non_user` warning before this gate
    // refuses it — the attempt stays visible in production logs. Reads use the
    // pure lookup; a refused read is logged by `requireSecurityRole` instead.
    const userId =
      ctx.operation === "read"
        ? await sessions.getCurrentUserId()
        : await sessions.getActingUserIdForWrite({
            table: ctx.table,
            operation: ctx.operation,
          });

    if (userId === null) {
      return { permitted: false, userId: null, reason: "no_mp_user" };
    }

    // Resolved after the acting user so an unattributed write still emits
    // `mp.write.non_user` above; checked before the role read because an
    // unconfigured app refuses everyone and the MP round-trip would be wasted.
    const policy = this.resolveRolePolicy();
    if (policy.kind === "unconfigured") {
      return { permitted: false, userId, reason: "roles_not_configured" };
    }

    const roles = await this.getSecurityRoles(userId);
    const permitted =
      policy.kind === "any"
        ? roles.length > 0
        : roles.some((r) => policy.names.includes(normalizeRoleName(r)));

    if (!permitted) {
      return {
        permitted: false,
        userId,
        reason: roles.length === 0 ? "no_security_role" : "role_not_permitted",
      };
    }

    return { permitted: true, userId, reason: null };
  }

  /**
   * Gates an MP read or write on security-role membership and returns the
   * acting user's MP `User_ID` so callers can use it for attribution.
   *
   * @throws UnauthorizedError when no MP user is attached to the session, or
   *         when the user holds no permitted security role
   */
  public async requireSecurityRole(ctx: AuthorizationContext): Promise<number> {
    const decision = await this.hasSecurityRole(ctx);

    if (!decision.permitted) {
      this.logDenied({
        ...ctx,
        userId: decision.userId,
        reason: decision.reason ?? "no_security_role",
      });
      throw new UnauthorizedError(
        decision.reason === "no_mp_user"
          ? `Not authorized: no Ministry Platform user is attached to this session (${ctx.operation} on ${ctx.table})`
          : decision.reason === "roles_not_configured"
            ? `Not authorized: no permitted MP security roles are configured for this app (${ctx.operation} on ${ctx.table})`
            : `Not authorized: an MP security role is required to ${ctx.operation} records in ${ctx.table}`,
      );
    }

    // `permitted` is only ever true with a resolved userId.
    return decision.userId as number;
  }

  /**
   * Write-only alias of {@link requireSecurityRole}, kept so existing write
   * call sites read as what they are and so the narrower operation union
   * catches a `read` passed by mistake at a write boundary.
   */
  public async requireSecurityRoleForWrite(ctx: {
    table: string;
    operation: "create" | "update" | "delete";
  }): Promise<number> {
    return this.requireSecurityRole(ctx);
  }

  /**
   * Resolves the effective role policy from the environment. Read per call
   * rather than at module load so tests and redeploys see changes.
   *
   * `MP_SECURITY_ROLES` wins when it yields a usable policy (`*` or at least
   * one role name); otherwise the deprecated `MP_WRITE_SECURITY_ROLES` is
   * consulted; otherwise the app is unconfigured and refuses everyone. A value
   * that is non-blank but names no roles (`","`) is a config error: it is
   * warned about and treated as unset — never as "any role".
   */
  public resolveRolePolicy(): RolePolicy {
    for (const envName of [SECURITY_ROLES_ENV, LEGACY_SECURITY_ROLES_ENV]) {
      const parsed = parseRoleValue(process.env[envName]);
      if (parsed.kind === "any" || parsed.kind === "list") return parsed;
      if (parsed.kind === "no_names") {
        this.warnConfigOnce(
          `no_names:${envName}`,
          `${envName} is set but names no roles; treating it as unset. Use a comma-separated list of MP security role names, or "*" for any role.`,
        );
      }
    }

    this.warnConfigOnce(
      "unconfigured",
      `No MP security roles are configured, so every user is refused the gated contact features. Set ${SECURITY_ROLES_ENV} to a comma-separated list of MP security role names (e.g. "Administrators,Pastoral Staff"), or to "*" to permit any MP security role.`,
    );
    return { kind: "unconfigured" };
  }

  /** Config problems already reported by this instance; each is logged once. */
  private readonly configWarnings = new Set<string>();

  private warnConfigOnce(key: string, message: string): void {
    if (this.configWarnings.has(key)) return;
    this.configWarnings.add(key);
    console.warn(
      JSON.stringify({ event: "mp.authz.config", problem: key, message }),
    );
  }

  /**
   * Emits a structured denial so refused operations are greppable in
   * production logs. Same shape convention as `mp.write.non_user`; reads get a
   * parallel `mp.read.unauthorized` event so the two can be alerted on
   * separately.
   */
  private logDenied(ctx: {
    table: string;
    operation: MpOperation;
    userId: number | null;
    reason: DenialReason;
  }): void {
    const isRead = ctx.operation === "read";
    console.warn(
      JSON.stringify({
        event: isRead ? "mp.read.unauthorized" : "mp.write.unauthorized",
        message:
          ctx.reason === "roles_not_configured"
            ? `MP ${isRead ? "read" : "write"} refused — no MP security roles are configured for this app`
            : `MP ${isRead ? "read" : "write"} refused — acting user lacks a permitted security role`,
        table: ctx.table,
        operation: ctx.operation,
        userId: ctx.userId,
        reason: ctx.reason,
      }),
    );
  }
}

export const authorizationService = AuthorizationService.getInstance();
