import { headers } from "next/headers";
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
   * session creation. No side effects. Prefer `getActingUserIdForWrite` at
   * MP write boundaries so non-user writes are logged.
   */
  public async getCurrentUserId(): Promise<number | null> {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      const userId = (
        session?.user as { userId?: number | null } | undefined
      )?.userId;
      return userId ?? null;
    } catch (err) {
      console.error("[SessionContextService] getSession failed", err);
      return null;
    }
  }

  /**
   * Returns the acting user's MP User_ID for a write operation. When no user
   * is resolved (anonymous / system / session lookup failed) emits a
   * structured `mp.write.non_user` warning so the unattributed write is
   * visible in production logs. Use this — not `getCurrentUserId` — at every
   * MP write boundary.
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
