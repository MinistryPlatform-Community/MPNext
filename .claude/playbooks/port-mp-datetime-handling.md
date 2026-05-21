# Playbook: Port Ministry Platform Date/Time Handling Into This Repo

You are Claude Code running in a repo that integrates with **Ministry Platform** (MP). Another team has solved a class of bugs where MP datetimes round-trip through UTC and silently drift by the server's-local-to-MP-timezone offset. This playbook ports that fix into the repo you're in.

**Outcome you're driving toward**

1. A `DomainTimezoneService` singleton exists in this repo and is the only path through which code reads `MPHelper.getDomainInfo().TimeZoneName`.
2. Every MP datetime write goes through `DomainTimezoneService.toMpSqlDatetime(...)`. No more `Date.toISOString()` / `T00:00:00.000Z` / `new Date(...).getFullYear()` patterns on the MP boundary.
3. Every MP datetime display uses `Intl.DateTimeFormat({ timeZone })` with the MP timezone, not browser-local parsing.
4. A reference doc `.claude/references/ministryplatform.datetimehandling.md` is checked in.
5. `CLAUDE.md` cites the reference and includes a Key Development Practice rule pointing to it.
6. Tests cover the service and at least one round-trip regression for a real datetime field, and pass under `TZ=UTC` and `TZ=America/Los_Angeles`.

**Do not skip the discovery phase.** Paths, naming, and the exact MPHelper surface may differ from the source project. Confirm the assumptions before writing code.

## Background — the bug class you're preventing

MP stores datetimes as **wall-clock values in the domain's configured time zone** (exposed via `getDomainInfo().TimeZoneName`). It does **not** normalize to UTC.

If a write path tags a value as UTC (e.g. appending `Z`) and then formats it with `new Date(...).getFullYear()` (which reads in the Node process's local zone), the SQL string sent to MP carries the server-local clock numbers for an instant that was tagged UTC. MP stores those numbers as if they were already in MP-TZ, so the record drifts by the server-to-MP offset. The mirror anti-pattern on the read path — `new Date(stringFromMp).toLocaleDateString(...)` — re-parses MP's wall-clock-in-MP-TZ as if it were browser-local, drifting again. When an edit form reads the already-shifted value and the write re-applies the transform, each edit shifts the date by another day.

Concrete example from the source repo: a customer saved a Contact Log at 11:33 PM Eastern on 2026-05-17. It saved as 2026-05-16 at 8:00 PM. Editing without changing any field shifted the date back another day every time.

The fix has three pieces:

1. **A boundary service** that knows the MP timezone, returns it as IANA, and converts values without going through `Date.toISOString()` or `Date.getFullYear()`.
2. **A grep-and-fix pass** on every site that touches an MP date column — forms, server actions, services, display formatters.
3. **A reference doc + CLAUDE.md update** so future MP date work doesn't re-introduce the pattern.

## Phase 1 — Discovery

Before writing any code, answer these by reading the repo:

1. **Where does `MPHelper` live, and what is its import path?**
   - In the source repo: `@/lib/providers/ministry-platform` exporting `MPHelper`, with `getDomainInfo()` returning `{ TimeZoneName, DisplayName, CultureName, ... }`.
   - In *this* repo it may be at a different path, named differently (e.g. `MinistryPlatformClient`), or expose domain info via a different method.
   - Find it: `grep -r "getDomainInfo" src/` and inspect the type. Confirm it returns a `TimeZoneName` field.
   - **Stop and ask the user** if `getDomainInfo` doesn't exist or doesn't surface a time zone. Don't invent it.

2. **Where do services live?** (e.g. `src/services/`, `src/lib/services/`, `app/services/`). Match the existing convention.

3. **Where do shared server actions live?** Some Next.js repos have `src/components/shared-actions/`, others have `src/app/actions/`, others have just `_actions.ts` files. Match the convention.

4. **Which testing framework?** Vitest or Jest. The mock patterns differ slightly. The source repo uses Vitest with `vi.hoisted()` and mocks `MPHelper` as a class. Adapt as needed.

5. **Path alias.** Most repos use `@/*` for `src/*`. Verify in `tsconfig.json`.

6. **MP date fields in this repo.** Grep for anti-patterns (these are the bugs you'll fix):
   ```
   grep -rn "T00:00:00.000Z" src/
   grep -rn "T00:00:00Z" src/
   grep -rn "\.toISOString()" src/
   grep -rn "new Date(.*)\.getFullYear()" src/
   grep -rn "new Date(.*)\.getMonth()" src/
   grep -rn "new Date(.*)\.toLocaleDateString" src/
   grep -rn "new Date(.*)\.toLocaleString" src/
   ```
   Also enumerate every component/server-action that writes a column ending in `_Date`, `_DateTime`, `_Time`, `Date`, or `Time` to MP. Common ones: `Contact_Date`, `Start_Date`, `End_Date`, `Birthdate`, `Donation_Date`, `Event_Start_Date`, `Pledge_Start_Date`.

7. **Is there already a partial fix in place?** Search for `TimeZoneName`, `timezone`, `tz`, `getDomainInfo` to see if anyone has started this work. If so, don't duplicate — extend it.

Write the answers down (you can use TaskCreate to track them). Only proceed to Phase 2 when each question has an answer or has been raised with the user.

## Phase 2 — Drop in the service

Create `src/services/domainTimezoneService.ts` (or wherever services live in this repo) with the contents below. Adjust the `MPHelper` import path if Phase 1 found it lives elsewhere. The file is self-contained — no other dependencies.

```ts
import { MPHelper } from "@/lib/providers/ministry-platform";

/**
 * Mapping of common Windows time zone IDs (as returned by the MP /domain endpoint's
 * `TimeZoneName` field) to IANA time zone identifiers (which `Intl.DateTimeFormat`
 * requires). Extend as new MP-hosted domains surface zones not listed here.
 */
const WINDOWS_TO_IANA: Record<string, string> = {
  "Dateline Standard Time": "Etc/GMT+12",
  "UTC-11": "Etc/GMT+11",
  "Aleutian Standard Time": "America/Adak",
  "Hawaiian Standard Time": "Pacific/Honolulu",
  "Marquesas Standard Time": "Pacific/Marquesas",
  "Alaskan Standard Time": "America/Anchorage",
  "UTC-09": "Etc/GMT+9",
  "Pacific Standard Time (Mexico)": "America/Tijuana",
  "UTC-08": "Etc/GMT+8",
  "Pacific Standard Time": "America/Los_Angeles",
  "US Mountain Standard Time": "America/Phoenix",
  "Mountain Standard Time (Mexico)": "America/Mazatlan",
  "Mountain Standard Time": "America/Denver",
  "Central America Standard Time": "America/Guatemala",
  "Central Standard Time": "America/Chicago",
  "Easter Island Standard Time": "Pacific/Easter",
  "Central Standard Time (Mexico)": "America/Mexico_City",
  "Canada Central Standard Time": "America/Regina",
  "SA Pacific Standard Time": "America/Bogota",
  "Eastern Standard Time (Mexico)": "America/Cancun",
  "Eastern Standard Time": "America/New_York",
  "Haiti Standard Time": "America/Port-au-Prince",
  "Cuba Standard Time": "America/Havana",
  "US Eastern Standard Time": "America/Indianapolis",
  "Turks And Caicos Standard Time": "America/Grand_Turk",
  "Paraguay Standard Time": "America/Asuncion",
  "Atlantic Standard Time": "America/Halifax",
  "Venezuela Standard Time": "America/Caracas",
  "Central Brazilian Standard Time": "America/Cuiaba",
  "SA Western Standard Time": "America/La_Paz",
  "Pacific SA Standard Time": "America/Santiago",
  "Newfoundland Standard Time": "America/St_Johns",
  "Tocantins Standard Time": "America/Araguaina",
  "E. South America Standard Time": "America/Sao_Paulo",
  "SA Eastern Standard Time": "America/Cayenne",
  "Argentina Standard Time": "America/Buenos_Aires",
  "Greenland Standard Time": "America/Godthab",
  "Montevideo Standard Time": "America/Montevideo",
  "Magallanes Standard Time": "America/Punta_Arenas",
  "Saint Pierre Standard Time": "America/Miquelon",
  "Bahia Standard Time": "America/Bahia",
  "UTC-02": "Etc/GMT+2",
  "Azores Standard Time": "Atlantic/Azores",
  "Cape Verde Standard Time": "Atlantic/Cape_Verde",
  UTC: "Etc/UTC",
  "GMT Standard Time": "Europe/London",
  "Greenwich Standard Time": "Atlantic/Reykjavik",
  "Sao Tome Standard Time": "Africa/Sao_Tome",
  "Morocco Standard Time": "Africa/Casablanca",
  "W. Europe Standard Time": "Europe/Berlin",
  "Central Europe Standard Time": "Europe/Budapest",
  "Romance Standard Time": "Europe/Paris",
  "Central European Standard Time": "Europe/Warsaw",
  "W. Central Africa Standard Time": "Africa/Lagos",
  "Jordan Standard Time": "Asia/Amman",
  "GTB Standard Time": "Europe/Bucharest",
  "Middle East Standard Time": "Asia/Beirut",
  "Egypt Standard Time": "Africa/Cairo",
  "E. Europe Standard Time": "Europe/Chisinau",
  "Syria Standard Time": "Asia/Damascus",
  "West Bank Standard Time": "Asia/Hebron",
  "South Africa Standard Time": "Africa/Johannesburg",
  "FLE Standard Time": "Europe/Kiev",
  "Israel Standard Time": "Asia/Jerusalem",
  "Kaliningrad Standard Time": "Europe/Kaliningrad",
  "Sudan Standard Time": "Africa/Khartoum",
  "Libya Standard Time": "Africa/Tripoli",
  "Namibia Standard Time": "Africa/Windhoek",
  "Arabic Standard Time": "Asia/Baghdad",
  "Turkey Standard Time": "Europe/Istanbul",
  "Arab Standard Time": "Asia/Riyadh",
  "Belarus Standard Time": "Europe/Minsk",
  "Russian Standard Time": "Europe/Moscow",
  "E. Africa Standard Time": "Africa/Nairobi",
  "Iran Standard Time": "Asia/Tehran",
  "Arabian Standard Time": "Asia/Dubai",
  "Astrakhan Standard Time": "Europe/Astrakhan",
  "Azerbaijan Standard Time": "Asia/Baku",
  "Russia Time Zone 3": "Europe/Samara",
  "Mauritius Standard Time": "Indian/Mauritius",
  "Saratov Standard Time": "Europe/Saratov",
  "Georgian Standard Time": "Asia/Tbilisi",
  "Volgograd Standard Time": "Europe/Volgograd",
  "Caucasus Standard Time": "Asia/Yerevan",
  "Afghanistan Standard Time": "Asia/Kabul",
  "West Asia Standard Time": "Asia/Tashkent",
  "Ekaterinburg Standard Time": "Asia/Yekaterinburg",
  "Pakistan Standard Time": "Asia/Karachi",
  "Qyzylorda Standard Time": "Asia/Qyzylorda",
  "India Standard Time": "Asia/Calcutta",
  "Sri Lanka Standard Time": "Asia/Colombo",
  "Nepal Standard Time": "Asia/Katmandu",
  "Central Asia Standard Time": "Asia/Almaty",
  "Bangladesh Standard Time": "Asia/Dhaka",
  "Omsk Standard Time": "Asia/Omsk",
  "Myanmar Standard Time": "Asia/Rangoon",
  "SE Asia Standard Time": "Asia/Bangkok",
  "Altai Standard Time": "Asia/Barnaul",
  "W. Mongolia Standard Time": "Asia/Hovd",
  "North Asia Standard Time": "Asia/Krasnoyarsk",
  "N. Central Asia Standard Time": "Asia/Novosibirsk",
  "Tomsk Standard Time": "Asia/Tomsk",
  "China Standard Time": "Asia/Shanghai",
  "North Asia East Standard Time": "Asia/Irkutsk",
  "Singapore Standard Time": "Asia/Singapore",
  "W. Australia Standard Time": "Australia/Perth",
  "Taipei Standard Time": "Asia/Taipei",
  "Ulaanbaatar Standard Time": "Asia/Ulaanbaatar",
  "Aus Central W. Standard Time": "Australia/Eucla",
  "Transbaikal Standard Time": "Asia/Chita",
  "Tokyo Standard Time": "Asia/Tokyo",
  "North Korea Standard Time": "Asia/Pyongyang",
  "Korea Standard Time": "Asia/Seoul",
  "Yakutsk Standard Time": "Asia/Yakutsk",
  "Cen. Australia Standard Time": "Australia/Adelaide",
  "AUS Central Standard Time": "Australia/Darwin",
  "E. Australia Standard Time": "Australia/Brisbane",
  "AUS Eastern Standard Time": "Australia/Sydney",
  "West Pacific Standard Time": "Pacific/Port_Moresby",
  "Tasmania Standard Time": "Australia/Hobart",
  "Vladivostok Standard Time": "Asia/Vladivostok",
  "Lord Howe Standard Time": "Australia/Lord_Howe",
  "Bougainville Standard Time": "Pacific/Bougainville",
  "Russia Time Zone 10": "Asia/Srednekolymsk",
  "Magadan Standard Time": "Asia/Magadan",
  "Norfolk Standard Time": "Pacific/Norfolk",
  "Sakhalin Standard Time": "Asia/Sakhalin",
  "Central Pacific Standard Time": "Pacific/Guadalcanal",
  "Russia Time Zone 11": "Asia/Kamchatka",
  "New Zealand Standard Time": "Pacific/Auckland",
  "UTC+12": "Etc/GMT-12",
  "Fiji Standard Time": "Pacific/Fiji",
  "Chatham Islands Standard Time": "Pacific/Chatham",
  "UTC+13": "Etc/GMT-13",
  "Tonga Standard Time": "Pacific/Tongatapu",
  "Samoa Standard Time": "Pacific/Apia",
  "Line Islands Standard Time": "Pacific/Kiritimati",
};

/**
 * Resolves an MP-provided time zone identifier to an IANA name. Accepts either a
 * Windows zone (MP's typical output, e.g. "Eastern Standard Time") or an IANA
 * name already (e.g. "America/New_York"). Throws if the value is unknown so
 * callers fail fast rather than silently drift to the server's local zone.
 */
export function resolveIanaTimezone(timeZone: string): string {
  if (!timeZone || typeof timeZone !== "string") {
    throw new Error("Time zone identifier is required");
  }
  const trimmed = timeZone.trim();
  if (trimmed.length === 0) {
    throw new Error("Time zone identifier is required");
  }
  if (trimmed === "UTC" || trimmed === "Etc/UTC") {
    return "Etc/UTC";
  }
  if (trimmed.includes("/")) {
    return trimmed;
  }
  const mapped = WINDOWS_TO_IANA[trimmed];
  if (!mapped) {
    throw new Error(
      `Unknown time zone "${trimmed}" — add it to the Windows→IANA mapping in domainTimezoneService.ts`
    );
  }
  return mapped;
}

function parseWallClockParts(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} | null {
  const trimmed = value.trim();
  if (/Z$/.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return null;
  }
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/
  );
  if (!match) {
    return null;
  }
  const [, y, mo, d, h = "00", mi = "00", s = "00"] = match;
  return {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: Number(s),
  };
}

function formatInstantAsMpSql(instant: Date, ianaTimeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ianaTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    lookup[part.type] = part.value;
  }
  // Some ICU builds emit "24" for midnight under hour12:false; normalize.
  const hour = lookup.hour === "24" ? "00" : lookup.hour;
  return `${lookup.year}-${lookup.month}-${lookup.day} ${hour}:${lookup.minute}:${lookup.second}`;
}

/**
 * DomainTimezoneService — singleton helper for converting date/time values
 * between MP's domain time zone and the application's various surfaces.
 *
 * Why this exists: MP stores datetimes as wall-clock values in the domain's
 * configured time zone (NOT UTC). Sending a UTC-tagged value or letting
 * `new Date(...).getFullYear()` round-trip through the server's local time
 * silently shifts dates by the offset between server and MP.
 */
export class DomainTimezoneService {
  private static instance: DomainTimezoneService | null = null;
  private mp: MPHelper;
  private cachedIana: string | null = null;
  private inflight: Promise<string> | null = null;

  private constructor() {
    this.mp = new MPHelper();
  }

  public static getInstance(): DomainTimezoneService {
    if (!DomainTimezoneService.instance) {
      DomainTimezoneService.instance = new DomainTimezoneService();
    }
    return DomainTimezoneService.instance;
  }

  public async getMpTimezone(): Promise<string> {
    if (this.cachedIana) {
      return this.cachedIana;
    }
    if (!this.inflight) {
      this.inflight = (async () => {
        const info = await this.mp.getDomainInfo();
        const iana = resolveIanaTimezone(info.TimeZoneName);
        this.cachedIana = iana;
        return iana;
      })().finally(() => {
        this.inflight = null;
      });
    }
    return this.inflight;
  }

  /**
   * Converts a value into the SQL datetime string MP's table API expects
   * ("YYYY-MM-DD HH:MM:SS" in the MP domain's wall-clock time).
   *
   *  - Wall-clock string with no zone marker → reformatted as MP-TZ wall-clock,
   *    missing components default to zero.
   *  - String with trailing "Z" or "±HH:MM" offset → parsed as a UTC/offset
   *    instant and converted into MP-TZ wall-clock.
   *  - `Date` instances → converted as UTC instants.
   */
  public async toMpSqlDatetime(value: Date | string): Promise<string> {
    if (value instanceof Date) {
      const iana = await this.getMpTimezone();
      return formatInstantAsMpSql(value, iana);
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error("toMpSqlDatetime: value must be a non-empty string or Date");
    }
    const wallClock = parseWallClockParts(value);
    if (wallClock) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${wallClock.year}-${pad(wallClock.month)}-${pad(wallClock.day)} ${pad(wallClock.hour)}:${pad(wallClock.minute)}:${pad(wallClock.second)}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`toMpSqlDatetime: unable to parse "${value}"`);
    }
    const iana = await this.getMpTimezone();
    return formatInstantAsMpSql(parsed, iana);
  }

  /**
   * Parses an MP wall-clock datetime string into a `Date` instant. Use when
   * you need real arithmetic on values returned from MP — for display, prefer
   * `Intl.DateTimeFormat({ timeZone })` directly against the raw string.
   */
  public async parseMpDatetime(value: string): Promise<Date> {
    const wallClock = parseWallClockParts(value);
    if (!wallClock) {
      const direct = new Date(value);
      if (Number.isNaN(direct.getTime())) {
        throw new Error(`parseMpDatetime: unable to parse "${value}"`);
      }
      return direct;
    }
    const iana = await this.getMpTimezone();
    const utcGuess = Date.UTC(
      wallClock.year,
      wallClock.month - 1,
      wallClock.day,
      wallClock.hour,
      wallClock.minute,
      wallClock.second
    );
    const projected = formatInstantAsMpSql(new Date(utcGuess), iana);
    const projectedParts = parseWallClockParts(projected)!;
    const projectedUtc = Date.UTC(
      projectedParts.year,
      projectedParts.month - 1,
      projectedParts.day,
      projectedParts.hour,
      projectedParts.minute,
      projectedParts.second
    );
    const offset = utcGuess - projectedUtc;
    return new Date(utcGuess + offset);
  }

  /** Test hook — clears cached domain info so the next call refetches. */
  public clearCache(): void {
    this.cachedIana = null;
    this.inflight = null;
  }
}

export const domainTimezoneService = DomainTimezoneService.getInstance();
```

## Phase 3 — Add the service tests

Create `src/services/domainTimezoneService.test.ts` next to the service. The mock pattern matters: this repo's singleton is constructed at module load, so the `MPHelper` mock must be set up before the import, which requires `vi.hoisted()` under Vitest. Under Jest, use `jest.mock` factory with the variable referenced at the bottom of the file or via `jest.requireActual` patterns — adapt to local conventions.

```ts
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
    // Use mockReset (not clearAllMocks) so mockResolvedValueOnce queues are
    // drained between tests. Date-only paths skip getMpTimezone() and would
    // otherwise leak unconsumed queue entries forward.
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
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "America/Chicago" });
      const svc = freshService();
      expect(await svc.getMpTimezone()).toBe("America/Chicago");
    });

    it("deduplicates concurrent first calls", async () => {
      let resolveFn!: (v: { TimeZoneName: string }) => void;
      mockGetDomainInfo.mockReturnValueOnce(
        new Promise((res) => { resolveFn = res; })
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
      expect(await svc.toMpSqlDatetime("2026-05-17 23:33:00")).toBe("2026-05-17 23:33:00");
    });

    it("preserves a T-separated wall-clock value", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "Eastern Standard Time" });
      const svc = freshService();
      expect(await svc.toMpSqlDatetime("2026-05-17T14:30")).toBe("2026-05-17 14:30:00");
    });

    it("converts a UTC-tagged instant into MP-TZ wall-clock", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "America/New_York" });
      const svc = freshService();
      expect(await svc.toMpSqlDatetime("2026-05-17T03:33:00.000Z")).toBe("2026-05-16 23:33:00");
    });

    it("converts a Date instant into MP-TZ wall-clock", async () => {
      mockGetDomainInfo.mockResolvedValueOnce({ TimeZoneName: "America/Los_Angeles" });
      const svc = freshService();
      const instant = new Date("2026-05-17T03:33:00.000Z");
      expect(await svc.toMpSqlDatetime(instant)).toBe("2026-05-16 20:33:00");
    });

    it("regression: date-only input does NOT shift when server is in a different TZ", async () => {
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
```

Run the service tests in isolation first:

```
npm run test:run -- src/services/domainTimezoneService.test.ts
```

Then re-run under two zones to prove the math is server-TZ independent:

```
TZ=UTC npm run test:run -- src/services/domainTimezoneService.test.ts
TZ=America/Los_Angeles npm run test:run -- src/services/domainTimezoneService.test.ts
```

All three runs must pass before moving on.

## Phase 4 — Add the shared server action for client display

Create a server action that exposes the MP timezone to client components. In the source repo this lives at `src/components/shared-actions/domain.ts`; in this repo, match the local convention from Phase 1.

```ts
'use server';

import { DomainTimezoneService } from '@/services/domainTimezoneService';

/**
 * Returns the IANA time zone identifier for the active Ministry Platform
 * domain. Use this to drive any client-side `Intl.DateTimeFormat` rendering
 * of MP-sourced datetime values so the displayed wall-clock matches MP's
 * database regardless of the user's browser zone.
 *
 * Result is cached for the lifetime of the server process.
 */
export async function getMpTimezone(): Promise<string> {
  const tz = DomainTimezoneService.getInstance();
  return tz.getMpTimezone();
}
```

## Phase 5 — Find and fix every MP datetime site

For each anti-pattern site Phase 1 found, apply the appropriate recipe below. **Confirm the field is an MP datetime column** (not a local-only field, not a Better Auth field, not a UI-only filter) before changing anything.

### Recipe A — form sends `${date}T00:00:00.000Z`

**Symptom:** A form with `<input type="date">` (or a hidden field) appends a `Z` suffix or builds an ISO string before submission.

**Fix:** Send the raw date string. The service handles the SQL formatting.

```diff
- Contact_Date: `${data.contactDate}T00:00:00.000Z`,
+ Contact_Date: data.contactDate,
```

### Recipe B — service does `new Date(x).getFullYear()` round-trip

**Symptom:** A service or server action receives a datetime string and reformats it using `new Date(x)` + `.getFullYear()` / `.getMonth()` / `.getDate()` / `.getHours()`. This reads in the **server's local zone**, which is silently wrong.

**Fix:** Route the value through `DomainTimezoneService.toMpSqlDatetime()`.

```diff
+ import { DomainTimezoneService } from "@/services/domainTimezoneService";
+
  public async createContactLog(input: ContactLogInput): Promise<ContactLog> {
-   if (input.Contact_Date) {
-     const date = new Date(input.Contact_Date);
-     const year = date.getFullYear();
-     const month = String(date.getMonth() + 1).padStart(2, '0');
-     // ... etc, building "YYYY-MM-DD HH:MM:SS"
-     input.Contact_Date = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
-   }
+   const tz = DomainTimezoneService.getInstance();
+   const mpDate = await tz.toMpSqlDatetime(input.Contact_Date);
    // ... pass mpDate through to MP
  }
```

If the existing code validates a Zod-generated schema that declares `Contact_Date: z.string().datetime()` (ISO format), validate the **non-date** fields with the schema and re-attach the converted SQL string afterwards:

```ts
const { Contact_Date, ...rest } = input;
const validatedRest = RecordSchema
  .omit({ Some_PK_ID: true, Contact_Date: true })
  .parse(rest);
const tz = DomainTimezoneService.getInstance();
const mpDate = await tz.toMpSqlDatetime(Contact_Date);
const payload = { ...validatedRest, Contact_Date: mpDate };
```

### Recipe C — display uses `new Date(stringFromMp).toLocaleDateString(...)`

**Symptom:** A client component renders an MP datetime via `new Date(...).toLocaleDateString()` or `.toLocaleString()`. This parses MP's wall-clock-in-MP-TZ as **browser-local**, then formats in the user's zone — silently wrong for any user not in MP-TZ.

**Fix:** Receive the MP timezone (IANA) as a prop from a server component that called `getMpTimezone()`. Format with `Intl.DateTimeFormat({ timeZone })`. To convert MP's wall-clock string to the matching UTC instant for the formatter, build a candidate UTC and correct by the round-trip offset (same algorithm the service uses internally):

```tsx
function formatMpDateTime(mpString: string, mpTimezone: string): string {
  const normalized = mpString.replace("T", " ").split(".")[0];
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?(?:Z)?$/
  );
  let instant: Date;
  if (match) {
    const [, y, mo, d, h = "00", mi = "00", s = "00"] = match;
    const utcGuess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: mpTimezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).formatToParts(new Date(utcGuess));
    const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
    const projectedHour = get("hour") === 24 ? 0 : get("hour");
    const projectedUtc = Date.UTC(
      get("year"), get("month") - 1, get("day"),
      projectedHour, get("minute"), get("second")
    );
    instant = new Date(utcGuess + (utcGuess - projectedUtc));
  } else {
    instant = new Date(mpString);
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: mpTimezone,
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(instant);
}
```

Wire the timezone into the component tree:

```tsx
// Server component (page or layout)
import { getMpTimezone } from "@/components/shared-actions/domain";
const mpTimezone = await getMpTimezone();
return <ContactLogs mpTimezone={mpTimezone} ... />;
```

### Recipe D — edit form pre-fill via `new Date(...)`

**Symptom:** An edit form reads an MP datetime and re-parses it: `setValue("date", new Date(log.Contact_Date).toISOString().split("T")[0])` or similar.

**Fix:** Since MP returns wall-clock in MP-TZ already, take string slices directly. For a date input:

```tsx
setValue("contactDate", log.Contact_Date.split("T")[0]);
```

For a `datetime-local` input (`YYYY-MM-DDTHH:MM`):

```tsx
function toDatetimeLocalValue(mpDate: string): string {
  const normalized = mpDate.replace(" ", "T");
  return normalized.length >= 16 ? normalized.slice(0, 16) : `${normalized.slice(0, 10)}T00:00`;
}
setValue("contactDate", toDatetimeLocalValue(log.Contact_Date));
```

### Recipe E — `$filter` date literal built from `Date.toISOString()`

**Symptom:** A filter string is built using `.toISOString()` or `.toUTCString()`.

**Fix:** MP filters interpret literals in MP-TZ. Use `toMpSqlDatetime` to produce the right string:

```ts
const tz = DomainTimezoneService.getInstance();
const cutoff = await tz.toMpSqlDatetime(new Date());
const filter = `Last_Activity_Date >= '${cutoff}'`;
```

### After every fix

Update or add a test that asserts the produced string matches MP-TZ wall-clock. Run the suite under both `TZ=UTC` and `TZ=America/Los_Angeles`; the test must pass under both.

## Phase 6 — Add a round-trip regression test for one real datetime field

Pick whichever MP write path you fixed and add a test that proves the date no longer drifts. Pattern (from the contact-log fix in the source repo):

```ts
it("regression: round-tripping the same edit does not shift the date", async () => {
  mockUpdateTableRecords.mockResolvedValue([{ Contact_Log_ID: 1 }]);

  const service = await ContactLogService.getInstance();
  await service.updateContactLog(1, { Contact_Date: "2026-05-17" });
  await service.updateContactLog(1, { Contact_Date: "2026-05-17" });
  await service.updateContactLog(1, { Contact_Date: "2026-05-17" });

  for (const call of mockUpdateTableRecords.mock.calls) {
    expect(call[1][0].Contact_Date).toBe("2026-05-17 00:00:00");
  }
});
```

If a service test file uses the singleton, reset both singletons in `beforeEach` and mock `getDomainInfo`:

```ts
beforeEach(() => {
  mockGetDomainInfo.mockReset();
  mockGetDomainInfo.mockResolvedValue({ TimeZoneName: "America/New_York" });
  (ContactLogService as any).instance = undefined;
  (DomainTimezoneService as any).instance = null;
});
```

## Phase 7 — Write the reference doc

Create `.claude/references/ministryplatform.datetimehandling.md` with this content. Adjust import paths if this repo uses a different alias or directory layout.

````markdown
# MP Date/Time Handling Reference

This document covers how date and datetime values must flow between the UI, our services, and the Ministry Platform (MP) API. Use it whenever you add a new MP date field, audit a server action that writes dates, or debug a "the saved date is wrong" report.

## Why MP is not UTC

MP stores datetimes as **wall-clock values in the domain's configured time zone** (e.g. `2026-05-17 23:33:00` is literally "11:33 PM in this church's time zone"). It does **not** normalize to UTC on the way in or out. The domain's time zone is exposed via `MPHelper.getDomainInfo().TimeZoneName`.

If you send a value tagged as UTC, MP stores it as if those UTC clock numbers were the local clock numbers — the saved record drifts by the MP-to-UTC offset. The same anti-pattern in reverse on the read path causes drift on display and compounds across edits.

A real symptom of this bug: a Contact Log entry created at 11:33 PM Eastern on 2026-05-17 saved as 2026-05-16 at 8:00 PM. The form appended `T00:00:00.000Z` to a date string, and the service ran `new Date(...).getFullYear()` on the result. Each save shifted the date by the offset between the Node server's local time and UTC. Editing read the already-shifted date and applied the same transform again, so the date moved backwards another day every edit.

## The service

`src/services/domainTimezoneService.ts` — singleton, server-side, cached per process. Always go through this; never reach into `MPHelper.getDomainInfo()` directly to read `TimeZoneName`.

```ts
import { DomainTimezoneService } from "@/services/domainTimezoneService";

const tz = DomainTimezoneService.getInstance();
await tz.getMpTimezone();                  // → "America/New_York" (IANA)
await tz.toMpSqlDatetime("2026-05-17");    // → "2026-05-17 00:00:00"
await tz.toMpSqlDatetime(new Date());      // → MP-TZ wall-clock for "now"
await tz.parseMpDatetime("2026-05-17 12:00:00"); // → Date instant
```

For client-side rendering, expose the IANA zone through `getMpTimezone()` in `src/components/shared-actions/domain.ts` and thread it as a prop into the component that needs to format MP datetimes.

### `toMpSqlDatetime(value)` — write path

Returns the SQL datetime string MP's table API expects (`YYYY-MM-DD HH:MM:SS`).

| Input | Treated as | Output |
| --- | --- | --- |
| `"2026-05-17"` | MP-TZ wall-clock midnight | `"2026-05-17 00:00:00"` |
| `"2026-05-17 14:30:00"` | MP-TZ wall-clock (already SQL) | `"2026-05-17 14:30:00"` |
| `"2026-05-17T14:30"` | MP-TZ wall-clock | `"2026-05-17 14:30:00"` |
| `"2026-05-17T03:33:00.000Z"` | UTC instant | converted to MP-TZ |
| `"2026-05-17T03:33:00-04:00"` | Instant at offset | converted to MP-TZ |
| `Date` instance | UTC instant | converted to MP-TZ |

The rule: **strings with no zone marker are wall-clock**, strings/Dates with explicit zone info are instants that get converted.

### `parseMpDatetime(value)` — read path arithmetic

Use when you need a `Date` instant to do real arithmetic on a value MP returned. For pure display, prefer `Intl.DateTimeFormat({ timeZone })` against the raw string.

## Recipes

### Writing a date-only field (`<input type="date">`)

```tsx
// Client component — send the raw string, no Z, no time.
const payload = { Contact_Date: form.contactDate /* "2026-05-17" */ };

// Server action / service
const tz = DomainTimezoneService.getInstance();
const mpDate = await tz.toMpSqlDatetime(payload.Contact_Date);
// → "2026-05-17 00:00:00"
```

### Writing a datetime field with a "save at current moment" intent

```ts
const tz = DomainTimezoneService.getInstance();
const mpDate = await tz.toMpSqlDatetime(new Date());
// → MP-TZ wall-clock representation of the server's "now"
```

### Pre-filling an edit form from a stored MP value

MP returns datetimes as wall-clock strings in MP-TZ (no zone marker). For a date input, take the date portion directly — **do not** parse with `new Date()`:

```tsx
setValue("contactDate", log.Contact_Date.split("T")[0]);
```

For a `datetime-local` input, trim to `YYYY-MM-DDTHH:MM`:

```tsx
function toDatetimeLocalValue(mpDate: string): string {
  const normalized = mpDate.replace(" ", "T");
  return normalized.length >= 16 ? normalized.slice(0, 16) : `${normalized.slice(0, 10)}T00:00`;
}
```

### Displaying a stored MP datetime in the browser

`new Date(stringFromMp).toLocaleDateString(...)` parses the string as **browser-local**, which silently disagrees with MP-TZ. Format with an explicit `timeZone`:

```tsx
return new Intl.DateTimeFormat("en-US", {
  timeZone: mpTimezone,
  month: "short", day: "numeric", year: "numeric",
  hour: "numeric", minute: "2-digit",
}).format(instant);
```

### Filtering on a date column in `$filter`

`$filter` strings are interpreted in MP-TZ. Quote the value and use MP-TZ wall-clock:

```ts
filter: `Contact_Date >= '2026-05-01' AND Contact_Date < '2026-06-01'`
```

Do not convert filter values to UTC. If you have a `Date` instant in JS, run it through `tz.toMpSqlDatetime(instant)` first.

## Anti-patterns

| ❌ Don't | ✅ Do |
| --- | --- |
| ``Contact_Date: `${date}T00:00:00.000Z` `` | `Contact_Date: date` |
| `new Date(formValue).toISOString()` | `await tz.toMpSqlDatetime(formValue)` |
| `new Date(mpValue).getFullYear()` etc. | `await tz.parseMpDatetime(mpValue)` or `Intl.DateTimeFormat({ timeZone })` |
| `new Date(mpValue).toLocaleString(...)` for display | `Intl.DateTimeFormat("en-US", { timeZone: mpTimezone, ... })` |
| Reading domain TZ ad-hoc per request | `DomainTimezoneService.getInstance().getMpTimezone()` (cached) |

The shared signature of these bugs: a `Date` object that crosses a zone boundary silently. Whenever you see `new Date(...)` near an MP read/write, ask "what zone is this assumed to be in, and what zone is the caller expecting back?"

## Windows ↔ IANA zone names

MP's `/domain` endpoint returns `TimeZoneName` as a **Windows** zone (e.g. `"Eastern Standard Time"`). `Intl.DateTimeFormat` requires **IANA** (e.g. `"America/New_York"`). `DomainTimezoneService` maps between them. If a new MP deployment surfaces an unmapped zone, `resolveIanaTimezone` throws with the unmapped name — extend the table rather than silently falling back to the server's local zone.

## Testing

When a test exercises code that goes through `DomainTimezoneService`:

1. **Mock `MPHelper.getDomainInfo`** to return a known `TimeZoneName` — use `vi.hoisted()` (Vitest) because the singleton's `MPHelper` is constructed at module-load time.
2. **Reset the singleton** between tests: `(DomainTimezoneService as any).instance = null` in `beforeEach`.
3. **Use `mockReset()` (not `clearAllMocks()`)** on the `getDomainInfo` mock. `clearAllMocks` doesn't drain `mockResolvedValueOnce` queues, and tests that don't hit `getMpTimezone()` leave queue entries behind that leak forward.
4. **Run under multiple `TZ` env vars** — at minimum `TZ=UTC` and `TZ=America/Los_Angeles`. The original bug was invisible when developer machines and the server happened to be in the same zone as the MP domain.
````

## Phase 8 — Update CLAUDE.md

Two edits to the repo's `CLAUDE.md`:

**1.** Add a new bullet to the **Key Development Practices** section. Number it to follow the existing list (in the source repo this was #10; in this repo it may be different — match the local convention):

```
N. **Convert all date/time values at the MP boundary** - use `DomainTimezoneService` (never raw `new Date(x).toISOString()` or `getFullYear()`) when sending or receiving datetime fields, since MP stores wall-clock values in the domain's time zone, not UTC. See **[Date/Time Handling Reference](.claude/references/ministryplatform.datetimehandling.md)**.
```

**2.** Add a line to the **Reference Documents** section pointing to the new doc:

```
- **[Ministry Platform Date/Time Handling](.claude/references/ministryplatform.datetimehandling.md)** - How to send/receive MP datetimes safely via `DomainTimezoneService`, anti-patterns, Windows↔IANA mapping, and test guidance
```

If this repo's CLAUDE.md doesn't have a "Reference Documents" section yet, create it after Key Development Practices.

## Phase 9 — Verify

Before declaring done:

1. `npm run lint` — clean.
2. `npm run test:run` (or whatever the local test command is) — all tests pass.
3. `npx tsc --noEmit` — no new type errors. Pre-existing errors in unrelated files are OK; note them in the PR description.
4. Run the service tests under `TZ=UTC` and `TZ=America/Los_Angeles` and confirm both pass:
   ```
   TZ=UTC npm run test:run -- src/services/domainTimezoneService.test.ts
   TZ=America/Los_Angeles npm run test:run -- src/services/domainTimezoneService.test.ts
   ```
5. Spot-check one bug fix manually if possible: open the app, exercise a date-handling feature, confirm the saved value matches what was entered and that editing without changing fields doesn't shift the value.

## Phase 10 — Branch, commit, PR

Use the repo's existing conventions. The source repo's commit message looked like this; adapt the scope to whichever feature carried the bug in this repo:

```
fix(<scope>): correct timezone handling on <field> save/edit

MP stores datetimes as wall-clock values in the domain's configured time
zone, not UTC. <Existing path> tagged values as UTC and round-tripped them
through `new Date(...).getFullYear()`, producing strings in the Node
server's local zone instead of MP's. Edits compounded the drift.

- Add DomainTimezoneService — singleton wrapping getDomainInfo() with
  Windows→IANA mapping and SQL datetime conversion.
- Add shared server action `getMpTimezone()` for client-side display.
- Fix <component/service> to route MP date columns through the service.
- Add reference doc `.claude/references/ministryplatform.datetimehandling.md`.
- Update CLAUDE.md with Key Development Practice + reference link.

Tests: <new count> new, <round-trip regression>, suite passes under
TZ=UTC and TZ=America/Los_Angeles.
```

Open the PR, request review, do not self-merge unless that's normal in this repo.

## What "done" looks like

- [ ] `src/services/domainTimezoneService.ts` exists and is the only file calling `MPHelper.getDomainInfo()` for `TimeZoneName`.
- [ ] `src/services/domainTimezoneService.test.ts` exists with at least the 16 tests above; passes under `TZ=UTC` and `TZ=America/Los_Angeles`.
- [ ] No remaining hits in `src/` for these greps on MP-bound date columns:
  - `T00:00:00.000Z`
  - `.toISOString()` *near* an MP field
  - `new Date(.*).getFullYear()` *near* an MP read/write
  - `new Date(.*).toLocaleDateString` *for an MP-sourced value*
- [ ] At least one feature has a round-trip regression test asserting no drift across three save cycles.
- [ ] `.claude/references/ministryplatform.datetimehandling.md` exists.
- [ ] `CLAUDE.md` has a Key Development Practices bullet and a Reference Documents entry pointing to it.
- [ ] Lint and full test suite pass.

If you hit something the playbook doesn't cover — a different MPHelper shape, an unusual existing partial fix, a non-MP date that grep flagged — stop and ask the user before improvising.
