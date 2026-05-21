import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetDomainInfo } = vi.hoisted(() => ({
  mockGetDomainInfo: vi.fn(),
}));

vi.mock("@/lib/providers/ministry-platform", () => {
  return {
    MPHelper: class {
      getDomainInfo = mockGetDomainInfo;
    },
  };
});

import {
  DomainTimezoneService,
  resolveIanaTimezone,
} from "@/services/domainTimezoneService";

function freshService(): DomainTimezoneService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (DomainTimezoneService as any).instance = null;
  return DomainTimezoneService.getInstance();
}

describe("resolveIanaTimezone", () => {
  it("maps common Windows zone names to IANA", () => {
    expect(resolveIanaTimezone("Eastern Standard Time")).toBe("America/New_York");
    expect(resolveIanaTimezone("Central Standard Time")).toBe("America/Chicago");
    expect(resolveIanaTimezone("Pacific Standard Time")).toBe("America/Los_Angeles");
    expect(resolveIanaTimezone("GMT Standard Time")).toBe("Europe/London");
  });

  it("passes through IANA zone names unchanged", () => {
    expect(resolveIanaTimezone("America/Chicago")).toBe("America/Chicago");
    expect(resolveIanaTimezone("Europe/Berlin")).toBe("Europe/Berlin");
  });

  it("normalizes UTC variants", () => {
    expect(resolveIanaTimezone("UTC")).toBe("Etc/UTC");
    expect(resolveIanaTimezone("Etc/UTC")).toBe("Etc/UTC");
  });

  it("throws for unknown identifiers rather than silently falling back", () => {
    expect(() => resolveIanaTimezone("Atlantis Standard Time")).toThrow(/Unknown time zone/);
    expect(() => resolveIanaTimezone("")).toThrow();
  });
});

describe("DomainTimezoneService", () => {
  beforeEach(() => {
    mockGetDomainInfo.mockReset();
  });

  describe("getMpTimezone", () => {
    it("fetches and caches the IANA zone after first call", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({
        TimeZoneName: "Eastern Standard Time",
        DisplayName: "Test",
        CultureName: "en-US",
      });
      const svc = freshService();

      expect(await svc.getMpTimezone()).toBe("America/New_York");
      expect(await svc.getMpTimezone()).toBe("America/New_York");
      expect(mockGetDomainInfo).toHaveBeenCalledTimes(1);
    });

    it("accepts an IANA zone from MP without mapping", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({
        TimeZoneName: "America/Chicago",
        DisplayName: "Test",
        CultureName: "en-US",
      });
      const svc = freshService();

      expect(await svc.getMpTimezone()).toBe("America/Chicago");
    });

    it("deduplicates concurrent first calls", async () => {
      let resolveFn!: (v: { TimeZoneName: string }) => void;
      mockGetDomainInfo.mockReturnValueOnce(
        new Promise((res) => {
          resolveFn = res;
        })
      );
      const svc = freshService();
      const a = svc.getMpTimezone();
      const b = svc.getMpTimezone();
      resolveFn({ TimeZoneName: "Eastern Standard Time" });

      expect(await a).toBe("America/New_York");
      expect(await b).toBe("America/New_York");
      expect(mockGetDomainInfo).toHaveBeenCalledTimes(1);
    });
  });

  describe("toMpSqlDatetime", () => {
    it("reformats a date-only string as MP-TZ midnight without conversion", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "Eastern Standard Time" });
      const svc = freshService();
      expect(await svc.toMpSqlDatetime("2026-05-17")).toBe("2026-05-17 00:00:00");
    });

    it("preserves an already-SQL wall-clock value (no UTC math)", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "Eastern Standard Time" });
      const svc = freshService();
      expect(await svc.toMpSqlDatetime("2026-05-17 23:33:00")).toBe(
        "2026-05-17 23:33:00"
      );
    });

    it("preserves a T-separated wall-clock value", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "Eastern Standard Time" });
      const svc = freshService();
      expect(await svc.toMpSqlDatetime("2026-05-17T14:30")).toBe(
        "2026-05-17 14:30:00"
      );
    });

    it("converts a UTC-tagged instant into MP-TZ wall-clock", async () => {
      // 2026-05-17T03:33:00Z = 2026-05-16 23:33:00 in America/New_York (EDT, UTC-4)
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "America/New_York" });
      const svc = freshService();
      expect(await svc.toMpSqlDatetime("2026-05-17T03:33:00.000Z")).toBe(
        "2026-05-16 23:33:00"
      );
    });

    it("converts a Date instant into MP-TZ wall-clock", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "America/Los_Angeles" });
      const svc = freshService();
      const instant = new Date("2026-05-17T03:33:00.000Z");
      // 2026-05-16 20:33:00 in America/Los_Angeles (PDT, UTC-7)
      expect(await svc.toMpSqlDatetime(instant)).toBe("2026-05-16 20:33:00");
    });

    it("regression: date-only input does NOT shift when server is in a different TZ", async () => {
      // Simulates the original bug: a US/Eastern server processing a date the
      // user picked in their browser. The fix is to NOT apply UTC conversion
      // to date-only inputs — they're wall-clock by intent.
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "America/New_York" });
      const svc = freshService();
      expect(await svc.toMpSqlDatetime("2026-05-17")).toBe("2026-05-17 00:00:00");
    });

    it("throws for unparseable input", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "Eastern Standard Time" });
      const svc = freshService();
      await expect(svc.toMpSqlDatetime("not a date")).rejects.toThrow();
      await expect(svc.toMpSqlDatetime("")).rejects.toThrow();
    });
  });

  describe("parseMpDatetime", () => {
    it("treats a wall-clock string as MP-TZ and returns the matching UTC instant", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "America/New_York" });
      const svc = freshService();
      // 2026-05-17 12:00:00 in America/New_York (EDT, UTC-4) = 2026-05-17T16:00:00Z
      const instant = await svc.parseMpDatetime("2026-05-17 12:00:00");
      expect(instant.toISOString()).toBe("2026-05-17T16:00:00.000Z");
    });

    it("respects an explicit Z marker", async () => {
      const svc = freshService();
      const instant = await svc.parseMpDatetime("2026-05-17T03:33:00.000Z");
      expect(instant.toISOString()).toBe("2026-05-17T03:33:00.000Z");
    });
  });
});
