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
  // IANA names contain a "/" (e.g. America/New_York, Etc/GMT+5).
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

/**
 * Parses an MP wall-clock string into its calendar parts. Accepts:
 *  - "YYYY-MM-DD"
 *  - "YYYY-MM-DD HH:MM[:SS]"
 *  - "YYYY-MM-DDTHH:MM[:SS][.fff]" (with or without trailing Z)
 *
 * Strings ending in "Z" or carrying an explicit ±HH:MM offset are returned as
 * `null` so callers know to parse them as `Date` instants rather than wall-clock.
 */
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

/**
 * Formats a `Date` instant as a wall-clock SQL datetime string in the supplied
 * IANA time zone. Output: "YYYY-MM-DD HH:MM:SS". Used when converting a known
 * UTC instant into the value MP's database expects.
 */
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
 * between MP's domain time zone and the application's various surfaces (form
 * inputs, server actions, display formatters).
 *
 * Why this exists: MP stores datetimes as wall-clock values in the domain's
 * configured time zone (NOT UTC). Sending a UTC-tagged value or letting
 * `new Date(...).getFullYear()` round-trip through the server's local time
 * silently shifts dates by the offset between server and MP. See
 * `.claude/references/ministryplatform.datetimehandling.md` for the full
 * recipe and the anti-patterns this service replaces.
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

  /**
   * Returns the IANA time zone identifier for the current MP domain. Result is
   * cached for the lifetime of the process — call `clearCache()` if a domain
   * configuration change needs to take effect without a restart.
   */
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
   * Input handling:
   *  - Wall-clock string with no zone marker (e.g. "2026-05-17",
   *    "2026-05-17 14:30:00", "2026-05-17T14:30") is treated as MP-TZ
   *    wall-clock and reformatted — missing components default to zero.
   *  - String with trailing "Z" or "±HH:MM" offset is parsed as a UTC
   *    instant and converted into MP-TZ wall-clock.
   *  - `Date` instances are converted as UTC instants.
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
    // Falls through to instant interpretation (Z or explicit offset).
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`toMpSqlDatetime: unable to parse "${value}"`);
    }
    const iana = await this.getMpTimezone();
    return formatInstantAsMpSql(parsed, iana);
  }

  /**
   * Parses an MP wall-clock datetime string into a `Date` instant. Use when you
   * need to do real arithmetic on values returned from MP — for display, prefer
   * `Intl.DateTimeFormat({ timeZone })` directly against the raw string.
   */
  public async parseMpDatetime(value: string): Promise<Date> {
    const wallClock = parseWallClockParts(value);
    if (!wallClock) {
      // Has an explicit zone marker — parse as instant directly.
      const direct = new Date(value);
      if (Number.isNaN(direct.getTime())) {
        throw new Error(`parseMpDatetime: unable to parse "${value}"`);
      }
      return direct;
    }
    const iana = await this.getMpTimezone();
    // Build a candidate UTC instant from the wall-clock fields, then correct
    // by the offset between that instant's UTC and MP-TZ representations.
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
