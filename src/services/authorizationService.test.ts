import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * AuthorizationService tests.
 *
 * These encode the decided policy (see `.claude/references/auth.md`): any
 * authenticated user holding an MP security role may write; ownership is not a
 * factor; the gate fails closed when the acting MP user or the role list cannot
 * be established.
 */

const { mockGetTableRecords, mockGetActingUserIdForWrite } = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
  mockGetActingUserIdForWrite: vi.fn(),
}));

vi.mock("@/lib/providers/ministry-platform", () => ({
  MPHelper: class {
    getTableRecords = mockGetTableRecords;
  },
}));

vi.mock("@/services/sessionContextService", () => ({
  SessionContextService: {
    getInstance: () => ({
      getActingUserIdForWrite: mockGetActingUserIdForWrite,
    }),
  },
}));

import { AuthorizationService, UnauthorizedError } from "./authorizationService";

const WRITE_CTX = { table: "Contact_Log", operation: "create" as const };

describe("AuthorizationService", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton so a stale MPHelper never leaks between tests.
    (AuthorizationService as unknown as { instance: unknown }).instance = undefined;
    delete process.env.MP_WRITE_SECURITY_ROLES;
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    delete process.env.MP_WRITE_SECURITY_ROLES;
  });

  describe("getInstance", () => {
    it("returns the same instance on repeat calls", () => {
      expect(AuthorizationService.getInstance()).toBe(AuthorizationService.getInstance());
    });
  });

  describe("getSecurityRoles", () => {
    it("queries dp_User_Roles for the given User_ID and returns role names", async () => {
      mockGetTableRecords.mockResolvedValueOnce([
        { Role_Name: "Administrators" },
        { Role_Name: "Pastoral Staff" },
      ]);

      const roles = await AuthorizationService.getInstance().getSecurityRoles(99);

      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: "dp_User_Roles",
        filter: "User_ID = 99",
        select: "Role_ID_TABLE.Role_Name",
      });
      expect(roles).toEqual(["Administrators", "Pastoral Staff"]);
    });

    it("returns an empty array when the user holds no roles", async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);
      expect(await AuthorizationService.getInstance().getSecurityRoles(99)).toEqual([]);
    });

    it("drops null and blank role names rather than treating them as roles", async () => {
      // A blank Role_Name must not satisfy the "holds any security role" check.
      mockGetTableRecords.mockResolvedValueOnce([
        { Role_Name: null },
        { Role_Name: "   " },
        { Role_Name: "Administrators" },
      ]);

      expect(await AuthorizationService.getInstance().getSecurityRoles(99)).toEqual([
        "Administrators",
      ]);
    });

    it("tolerates a nullish response from MP", async () => {
      mockGetTableRecords.mockResolvedValueOnce(undefined);
      expect(await AuthorizationService.getInstance().getSecurityRoles(99)).toEqual([]);
    });

    it.each([0, -1, 1.5, NaN])(
      "refuses to interpolate a non-positive-integer User_ID (%s)",
      async (badId) => {
        await expect(
          AuthorizationService.getInstance().getSecurityRoles(badId)
        ).rejects.toThrow(UnauthorizedError);
        expect(mockGetTableRecords).not.toHaveBeenCalled();
      }
    );
  });

  describe("requireSecurityRoleForWrite", () => {
    it("returns the acting User_ID when the user holds any security role", async () => {
      mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
      mockGetTableRecords.mockResolvedValueOnce([{ Role_Name: "Pastoral Staff" }]);

      const userId = await AuthorizationService.getInstance().requireSecurityRoleForWrite(
        WRITE_CTX
      );

      expect(userId).toBe(99);
      expect(mockGetActingUserIdForWrite).toHaveBeenCalledWith(WRITE_CTX);
    });

    it("rejects when no MP user is attached to the session", async () => {
      mockGetActingUserIdForWrite.mockResolvedValueOnce(null);

      await expect(
        AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
      ).rejects.toThrow(/no Ministry Platform user is attached/);

      // Fails closed — no role lookup is even attempted.
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it("rejects an authenticated user who holds no security role", async () => {
      mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
      mockGetTableRecords.mockResolvedValueOnce([]);

      await expect(
        AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
      ).rejects.toThrow(/an MP security role is required to create records in Contact_Log/);
    });

    it("emits a greppable mp.write.unauthorized warning on denial", async () => {
      mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
      mockGetTableRecords.mockResolvedValueOnce([]);

      await expect(
        AuthorizationService.getInstance().requireSecurityRoleForWrite({
          table: "Contact_Log",
          operation: "delete",
        })
      ).rejects.toThrow(UnauthorizedError);

      const payload = JSON.parse(warnSpy.mock.calls.at(-1)![0] as string);
      expect(payload).toMatchObject({
        event: "mp.write.unauthorized",
        table: "Contact_Log",
        operation: "delete",
        userId: 99,
        reason: "no_security_role",
      });
    });

    it("distinguishes a missing MP user from a missing role in the denial log", async () => {
      mockGetActingUserIdForWrite.mockResolvedValueOnce(null);

      await expect(
        AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
      ).rejects.toThrow(UnauthorizedError);

      const payload = JSON.parse(warnSpy.mock.calls.at(-1)![0] as string);
      expect(payload).toMatchObject({ reason: "no_mp_user", userId: null });
    });

    it("propagates a failed role lookup instead of allowing the write", async () => {
      mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
      mockGetTableRecords.mockRejectedValueOnce(new Error("MP unavailable"));

      await expect(
        AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
      ).rejects.toThrow("MP unavailable");
    });

    it("does not cache the authorization decision across writes", async () => {
      // A revoked role must take effect immediately.
      mockGetActingUserIdForWrite.mockResolvedValue(99);
      mockGetTableRecords.mockResolvedValueOnce([{ Role_Name: "Administrators" }]);
      const svc = AuthorizationService.getInstance();

      await expect(svc.requireSecurityRoleForWrite(WRITE_CTX)).resolves.toBe(99);

      mockGetTableRecords.mockResolvedValueOnce([]);
      await expect(svc.requireSecurityRoleForWrite(WRITE_CTX)).rejects.toThrow(
        UnauthorizedError
      );
      expect(mockGetTableRecords).toHaveBeenCalledTimes(2);
    });

    describe("MP_WRITE_SECURITY_ROLES", () => {
      it("permits only the named roles when the env var is set", async () => {
        process.env.MP_WRITE_SECURITY_ROLES = "Administrators,Pastoral Staff";
        mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
        mockGetTableRecords.mockResolvedValueOnce([{ Role_Name: "Pastoral Staff" }]);

        await expect(
          AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
        ).resolves.toBe(99);
      });

      it("rejects a role that is not on the list", async () => {
        process.env.MP_WRITE_SECURITY_ROLES = "Administrators";
        mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
        mockGetTableRecords.mockResolvedValueOnce([{ Role_Name: "Volunteer" }]);

        await expect(
          AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
        ).rejects.toThrow(UnauthorizedError);

        const payload = JSON.parse(warnSpy.mock.calls.at(-1)![0] as string);
        expect(payload).toMatchObject({ reason: "role_not_permitted" });
      });

      it("compares role names case- and whitespace-insensitively", async () => {
        process.env.MP_WRITE_SECURITY_ROLES = "  administrators , Pastoral Staff ";
        mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
        mockGetTableRecords.mockResolvedValueOnce([{ Role_Name: "ADMINISTRATORS" }]);

        await expect(
          AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
        ).resolves.toBe(99);
      });

      it("falls back to 'any security role' when the env var is blank or all separators", async () => {
        process.env.MP_WRITE_SECURITY_ROLES = " , , ";
        mockGetActingUserIdForWrite.mockResolvedValueOnce(99);
        mockGetTableRecords.mockResolvedValueOnce([{ Role_Name: "Volunteer" }]);

        await expect(
          AuthorizationService.getInstance().requireSecurityRoleForWrite(WRITE_CTX)
        ).resolves.toBe(99);
      });

      it("is read per call, not captured at module load", async () => {
        mockGetActingUserIdForWrite.mockResolvedValue(99);
        mockGetTableRecords.mockResolvedValue([{ Role_Name: "Volunteer" }]);
        const svc = AuthorizationService.getInstance();

        await expect(svc.requireSecurityRoleForWrite(WRITE_CTX)).resolves.toBe(99);

        process.env.MP_WRITE_SECURITY_ROLES = "Administrators";
        await expect(svc.requireSecurityRoleForWrite(WRITE_CTX)).rejects.toThrow(
          UnauthorizedError
        );
      });
    });
  });
});
