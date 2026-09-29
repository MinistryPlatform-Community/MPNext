import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

import { SessionContextService } from "@/services/sessionContextService";

describe("SessionContextService", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockGetSession.mockReset();
    mockHeaders.mockReset();
    mockHeaders.mockResolvedValue(new Headers());
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SessionContextService as any).instance = null;
  });

  afterEach(() => {
    // Restore console spies so they don't stack across tests.
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe("getInstance", () => {
    it("returns a singleton", () => {
      expect(SessionContextService.getInstance()).toBe(
        SessionContextService.getInstance(),
      );
    });
  });

  describe("getCurrentUserId", () => {
    it("returns userId when session has it", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { userId: 42 } });
      const result = await SessionContextService.getInstance().getCurrentUserId();
      expect(result).toBe(42);
    });

    it("returns null when session is null", async () => {
      mockGetSession.mockResolvedValueOnce(null);
      const result = await SessionContextService.getInstance().getCurrentUserId();
      expect(result).toBeNull();
    });

    it("returns null when session.user has no userId", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { name: "Anon" } });
      const result = await SessionContextService.getInstance().getCurrentUserId();
      expect(result).toBeNull();
    });

    it("returns null and logs when getSession throws", async () => {
      mockGetSession.mockRejectedValueOnce(new Error("session boom"));
      const result = await SessionContextService.getInstance().getCurrentUserId();
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        "[SessionContextService] getSession failed",
        { errName: "Error" },
      );
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("session boom");
    });

    it("logs a non-Error rejection by its type", async () => {
      mockGetSession.mockRejectedValueOnce("boom");
      const result = await SessionContextService.getInstance().getCurrentUserId();
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        "[SessionContextService] getSession failed",
        { errName: "string" },
      );
    });

    it("rethrows Next.js control-flow errors instead of swallowing them", async () => {
      // The shape Next throws when a route bails out of static rendering.
      const bailout = Object.assign(new Error("Dynamic server usage"), {
        digest: "DYNAMIC_SERVER_USAGE",
      });
      mockGetSession.mockRejectedValueOnce(bailout);
      await expect(
        SessionContextService.getInstance().getCurrentUserId(),
      ).rejects.toBe(bailout);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("does not warn on the pure-read path", async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await SessionContextService.getInstance().getCurrentUserId();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("getActingUserIdForWrite", () => {
    it("returns userId and does not warn when resolved", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { userId: 7 } });

      const result = await SessionContextService.getInstance().getActingUserIdForWrite({
        table: "Contact_Log",
        operation: "create",
      });

      expect(result).toBe(7);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("returns null and emits structured warn when no session", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const result = await SessionContextService.getInstance().getActingUserIdForWrite({
        table: "Contacts",
        operation: "update",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);

      const payload = JSON.parse(warnSpy.mock.calls[0][0] as string);
      expect(payload).toMatchObject({
        event: "mp.write.non_user",
        table: "Contacts",
        operation: "update",
      });
      expect(payload.message).toContain("NonUser Write");
    });

    it("emits warn with the correct table/operation per call", async () => {
      mockGetSession.mockResolvedValue(null);

      await SessionContextService.getInstance().getActingUserIdForWrite({
        table: "Contact_Log",
        operation: "delete",
      });

      const payload = JSON.parse(warnSpy.mock.calls[0][0] as string);
      expect(payload.table).toBe("Contact_Log");
      expect(payload.operation).toBe("delete");
    });

    it("still warns when getSession throws (treated as anonymous)", async () => {
      mockGetSession.mockRejectedValueOnce(new Error("session boom"));

      const result = await SessionContextService.getInstance().getActingUserIdForWrite({
        table: "Contact_Log",
        operation: "create",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
