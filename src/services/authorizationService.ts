import { MPHelper } from "@/lib/providers/ministry-platform";
import { sanitizeNumericId } from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import { SessionContextService } from "@/services/sessionContextService";

/**
 * Thrown when the acting user is authenticated but not permitted to perform
 * the requested Ministry Platform write.
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

/**
 * Env var naming the MP security roles permitted to perform gated writes,
 * comma-separated (e.g. `MP_WRITE_SECURITY_ROLES="Administrators,Pastoral Staff"`).
 *
 * Unset or empty means "any MP security role" — the decided default policy.
 * Set it to tighten the gate without a code change.
 */
const REQUIRED_ROLES_ENV = "MP_WRITE_SECURITY_ROLES";

function normalizeRoleName(role: string): string {
  return role.trim().toLowerCase();
}

/**
 * Parses `MP_WRITE_SECURITY_ROLES` into normalized role names, or returns null
 * when unset/blank, which means "holding any MP security role is sufficient".
 * Read per call rather than at module load so tests and redeploys see changes.
 */
function parseRequiredRoles(): string[] | null {
  const raw = process.env[REQUIRED_ROLES_ENV];
  if (!raw) return null;
  const names = raw
    .split(",")
    .map(normalizeRoleName)
    .filter((r) => r.length > 0);
  return names.length > 0 ? names : null;
}

/**
 * AuthorizationService — decides whether the acting user may perform a
 * Ministry Platform write.
 *
 * Policy (decided 2026-08-21, see `.claude/references/auth.md`): any
 * authenticated user who holds an MP security role may create, edit, and
 * delete contact logs — including logs another user created. MP security roles
 * are the domain's own authorization mechanism, so this app defers to them
 * rather than inventing a parallel one. Ownership (`Made_By`) is deliberately
 * NOT a factor: staff need to be able to correct and remove each other's logs.
 *
 * Authentication alone is not sufficient. A session for an MP user with no
 * security role at all cannot write, and neither can a session whose MP
 * `User_ID` never resolved — the gate fails closed.
 *
 * No caching. Roles are re-read from MP on every gated write, one extra read
 * per write. Writes are rare (a staff member saving a form) and a cached
 * authorization decision means a revoked role keeps working; that trade is not
 * worth making for a shared production database.
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
   * Returns the MP security role names held by a user.
   *
   * @param userId - MP `User_ID` (must be a positive integer)
   * @returns Role names from `dp_User_Roles`; empty when the user holds none
   */
  public async getSecurityRoles(userId: number): Promise<string[]> {
    // `sanitizeNumericId` is the single source of truth for the numeric-ID rule
    // (see filter-sanitize.ts) and guards the interpolation below. Its plain
    // Error is re-thrown as UnauthorizedError: an unusable acting User_ID means
    // we cannot establish permission, so it must fail closed as an authz denial
    // rather than surface as a generic validation error.
    let safeUserId: number;
    try {
      safeUserId = sanitizeNumericId(userId, "acting MP User_ID");
    } catch {
      throw new UnauthorizedError(
        "Not authorized: acting MP User_ID is not a valid identifier",
      );
    }

    const records = await this.helper().getTableRecords<{ Role_Name: string | null }>({
      table: "dp_User_Roles",
      filter: `User_ID = ${safeUserId}`,
      select: "Role_ID_TABLE.Role_Name",
    });

    return (records ?? [])
      .map((r) => r.Role_Name)
      .filter((name): name is string => Boolean(name && name.trim()));
  }

  /**
   * Gates an MP write on security-role membership and returns the acting
   * user's MP `User_ID` so callers can use it for attribution.
   *
   * Resolves the acting user through `SessionContextService`, so an
   * unattributed write still emits the structured `mp.write.non_user` warning
   * before this gate rejects it — the attempt stays visible in production logs.
   *
   * @throws UnauthorizedError when no MP user is attached to the session, or
   *         when the user holds no permitted security role
   */
  public async requireSecurityRoleForWrite(ctx: {
    table: string;
    operation: "create" | "update" | "delete";
  }): Promise<number> {
    const userId = await SessionContextService.getInstance()
      .getActingUserIdForWrite(ctx);

    if (userId === null) {
      this.logDenied({ ...ctx, userId: null, reason: "no_mp_user" });
      throw new UnauthorizedError(
        `Not authorized: no Ministry Platform user is attached to this session (${ctx.operation} on ${ctx.table})`,
      );
    }

    const roles = await this.getSecurityRoles(userId);
    const required = parseRequiredRoles();
    const permitted =
      required === null
        ? roles.length > 0
        : roles.some((r) => required.includes(normalizeRoleName(r)));

    if (!permitted) {
      this.logDenied({
        ...ctx,
        userId,
        reason: roles.length === 0 ? "no_security_role" : "role_not_permitted",
      });
      throw new UnauthorizedError(
        `Not authorized: an MP security role is required to ${ctx.operation} records in ${ctx.table}`,
      );
    }

    return userId;
  }

  /**
   * Emits a structured denial so refused writes are greppable in production
   * logs. Same shape convention as `mp.write.non_user`.
   */
  private logDenied(ctx: {
    table: string;
    operation: string;
    userId: number | null;
    reason: string;
  }): void {
    console.warn(
      JSON.stringify({
        event: "mp.write.unauthorized",
        message: "MP write refused — acting user lacks a permitted security role",
        table: ctx.table,
        operation: ctx.operation,
        userId: ctx.userId,
        reason: ctx.reason,
      }),
    );
  }
}

export const authorizationService = AuthorizationService.getInstance();
