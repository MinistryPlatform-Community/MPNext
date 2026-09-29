import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * SessionContextService — resolves the current request's acting MP user for
 * audit attribution on writes.
 *
 * Why this exists: MP's audit log keys on the `$userId` passed to write APIs.
 * Without it, every change is attributed to the OAuth integration account,
 * which destroys the "who did what" trail. This service centralizes pulling
 * the acting user's MP `User_ID` from the Better Auth session (where it is
 * baked in by `customSession` in `src/lib/auth.ts`).
 *
 * Anonymous writes are legitimate (the app may serve unauthenticated users in
 * the future) but always surfaced: `getActingUserIdForWrite` emits a
 * structured `mp.write.non_user` warning so non-user writes are visible in
 * production logs (Vercel, log aggregators) and can be investigated.
 */
export class SessionContextService {
  private static instance: SessionContextService | null = null;

  private constructor() {}

  public static getInstance(): SessionContextService {
    if (!SessionContextService.instance) {
      SessionContextService.instance = new SessionContextService();
    }
    return SessionContextService.instance;
  }

  /**
   * Pure read — returns the acting user's MP User_ID for the current request,
   * or null when there is no session or no User_ID could be resolved at
   * session creation. No side effects. Not a gate: a null here must be
   * refused by the caller — MP write and read boundaries go through
   * `AuthorizationService.requireSecurityRole`, which does.
   */
  public async getCurrentUserId(): Promise<number | null> {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      const userId = (
        session?.user as { userId?: number | null } | undefined
      )?.userId;
      return userId ?? null;
    } catch (err) {
      // Let Next's own control-flow errors (dynamic-rendering bailout during
      // `next build`, redirect, notFound) through instead of logging them.
      unstable_rethrow(err);
      // Name only: an error object can carry a response body or the
      // `$filter` of the `User_ID` lookup (the user's GUID).
      console.error("[SessionContextService] getSession failed", {
        errName: err instanceof Error ? err.name : typeof err,
      });
      return null;
    }
  }

  /**
   * Returns the acting user's MP User_ID for a write operation. When no user
   * is resolved (anonymous / system / session lookup failed) emits a
   * structured `mp.write.non_user` warning so the unattributed write is
   * visible in production logs.
   *
   * **This is attribution, not authorization.** It logs and returns null
   * rather than refusing, so a write that takes its `$userId` from here with
   * no gate in front goes through unauthorized — exactly F10 (2026-09-12).
   * Its one caller is `AuthorizationService.hasSecurityRole`, which uses it
   * for the write half of the gate and then refuses a null. Services and
   * actions must call `AuthorizationService.requireSecurityRole` and use the
   * `User_ID` it returns, never this.
   *
   * It stays public (2026-09-28 review) only because its caller is a
   * different class and TypeScript has no "friend" access; merging the two
   * services is a larger change than the risk warrants. Nothing else in
   * `src/` calls it — keep it that way.
   */
  public async getActingUserIdForWrite(ctx: {
    table: string;
    operation: "create" | "update" | "delete";
  }): Promise<number | null> {
    const userId = await this.getCurrentUserId();
    if (userId === null) {
      // Stable shape — grep / alerts can rely on `event: mp.write.non_user`.
      console.warn(
        JSON.stringify({
          event: "mp.write.non_user",
          message:
            "NonUser Write — MP write performed without a resolved acting user",
          table: ctx.table,
          operation: ctx.operation,
        }),
      );
    }
    return userId;
  }
}

export const sessionContextService = SessionContextService.getInstance();
