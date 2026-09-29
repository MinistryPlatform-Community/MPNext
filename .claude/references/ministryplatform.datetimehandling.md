# MP Date/Time Handling Reference

This document covers how date and datetime values must flow between the UI, our services, and the Ministry Platform (MP) API. Use it whenever you add a new MP date field, audit a server action that writes dates, or debug a "the saved date is wrong" report. Companion file: `ministryplatform.query-syntax.md` (for date filters in `$filter`).

## Why MP is not UTC

MP stores datetimes as **wall-clock values in the domain's configured time zone** (e.g. `2026-05-17 23:33:00` is literally "11:33 PM in this church's time zone"). It does **not** normalize to UTC on the way in or out. The domain's time zone is exposed via `MPHelper.getDomainInfo().TimeZoneName`.

If you send a value tagged as UTC, MP stores it as if those UTC clock numbers were the local clock numbers — the saved record drifts by the MP-to-UTC offset. The same anti-pattern in reverse on the read path causes drift on display and compounds across edits.

The contact-log timezone bug (2026-05-20) traced to two mistakes on the same path: the form appending `T00:00:00.000Z` to a date string, and the service running `new Date(...).getFullYear()` on the result. Each save shifted the date by the offset between the Node server's local time and UTC. Editing read the already-shifted date and applied the same transform again, so the date moved backwards another day every edit.

## The service

`src/services/domainTimezoneService.ts` — singleton, server-side, cached per process. Always go through this; never reach into `MPHelper.getDomainInfo()` directly to read `TimeZoneName`.

```ts
import { DomainTimezoneService } from "@/services/domainTimezoneService";

const tz = DomainTimezoneService.getInstance();
await tz.getMpTimezone();                  // → "America/New_York" (IANA)
await tz.toMpSqlDatetime("2026-05-17");    // → "2026-05-17 00:00:00"
await tz.toMpSqlDatetime(new Date());      // → MP-TZ wall-clock for "now"
await tz.parseMpDatetime("2026-05-17 12:00:00"); // → Date instant
tz.clearCache();                           // drop the cached zone (tests / config change)
```

The complete public surface of the module:

| Export | Signature |
| --- | --- |
| `DomainTimezoneService.getInstance` | `static getInstance(): DomainTimezoneService` |
| `getMpTimezone` | `getMpTimezone(): Promise<string>` |
| `toMpSqlDatetime` | `toMpSqlDatetime(value: Date \| string): Promise<string>` |
| `parseMpDatetime` | `parseMpDatetime(value: string): Promise<Date>` |
| `clearCache` | `clearCache(): void` |
| `resolveIanaTimezone` | `resolveIanaTimezone(timeZone: string): string` (standalone function, not a method) |
| `domainTimezoneService` | eagerly-constructed singleton instance, exported for convenience |

Caching: `getMpTimezone()` fetches `/domain` once per process and memoizes the resolved IANA name.
Concurrent first calls are deduplicated onto one in-flight promise, so a cold start with several
simultaneous requests still makes a single API call. `clearCache()` drops both the cached value and the
in-flight promise. `toMpSqlDatetime` and `parseMpDatetime` only touch the cache on the paths that need
the zone — a pure wall-clock string never calls `getDomainInfo` at all.

For client-side rendering, expose the IANA zone through the `getMpTimezone()` **server action** in
`src/components/shared-actions/domain.ts` (same name, different thing — it wraps the service method and
requires an authenticated session) and thread it as a prop into the component that needs to format MP
datetimes. `src/app/(web)/contactlookup/[guid]/page.tsx` awaits it and passes `mpTimezone` down through
`ContactLookupDetails` to `ContactLogs`.

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

It rejects rather than guesses: an empty/whitespace-only string or a non-string non-`Date` throws
`toMpSqlDatetime: value must be a non-empty string or Date`, and a string that matches neither the
wall-clock shape nor `Date` parsing throws `toMpSqlDatetime: value could not be parsed as a date`
(the value is deliberately not echoed — it can be caller input). Accepted
wall-clock shapes are `YYYY-MM-DD`, `YYYY-MM-DD HH:MM[:SS]` and `YYYY-MM-DDTHH:MM[:SS][.fff]`; missing
components default to zero.

### `parseMpDatetime(value)` — read path arithmetic

Use when you need a `Date` instant to do real arithmetic on a value MP returned (date diff, age calculation, comparison). For pure display, prefer `Intl.DateTimeFormat({ timeZone })` against the raw string — it's cheaper and avoids a round-trip through the cached domain info.

A wall-clock string is interpreted as MP-TZ (`"2026-05-17 12:00:00"` in `America/New_York` → the
`2026-05-17T16:00:00.000Z` instant). A string carrying `Z` or an explicit `±HH:MM` offset skips the
wall-clock path entirely and is parsed directly, without consulting the domain zone; if that parse
yields an Invalid Date it throws `parseMpDatetime: value could not be parsed as a date` (again
without the value).

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

### Writing from a `<input type="datetime-local">` (user picks date + time in their browser)

`datetime-local` emits values like `"2026-05-17T14:30"` — a bare wall-clock with no zone. This is the
input the contact-log form actually uses.

The approach taken in `contact-logs.tsx` is to make the field **MP-TZ wall-clock end to end**, so the
browser's own zone never enters the calculation:

- The default value is produced by a local `getNowInMpTz(timeZone)` helper, which renders "now" through
  `Intl.DateTimeFormat("en-CA", { timeZone, hour12: false })` into `"YYYY-MM-DDTHH:MM"`. The user sees
  MP's clock, not their browser's.
- The form value is submitted **verbatim** (`Contact_Date: data.contactDate`).
- The server action / service hands it to `toMpSqlDatetime`, which sees no zone marker, treats it as
  MP-TZ wall-clock, and reformats it to `"YYYY-MM-DD HH:MM:SS"` without any UTC arithmetic.

Do not attach the browser's zone to the value on the way in. Once the picker is seeded in MP-TZ, the
string the user edits is already in the target zone, and converting it again would reintroduce the
original bug.

### Pre-filling an edit form from a stored MP value

MP returns datetimes as wall-clock strings in MP-TZ (no zone marker), as either `"YYYY-MM-DDTHH:MM:SS"`
or `"YYYY-MM-DD HH:MM:SS"`. Reshape the string — **do not** parse with `new Date()`. For a
`datetime-local` input that means normalizing the separator and trimming to 16 characters
(`toDatetimeLocalValue` in `contact-logs.tsx`):

```tsx
const normalized = mpDate.replace(" ", "T");
const value = normalized.length >= 16 ? normalized.slice(0, 16) : `${normalized.slice(0, 10)}T00:00`;
setValue("contactDate", value);
```

For a date-only `<input type="date">` the same principle applies — take the first 10 characters.

### Displaying a stored MP datetime in the browser

`new Date(stringFromMp).toLocaleDateString(...)` parses the string as **browser-local**, which silently disagrees with MP-TZ for users sitting in a different zone. Format with an explicit `timeZone`:

The working helper is `formatDateTime(dateString: string, timeZone: string)` in
`src/components/contact-logs/contact-logs.tsx`. It parses the wall-clock fields out of the MP string,
builds the UTC instant that renders back to those same fields in `timeZone`, then formats:

```tsx
return new Intl.DateTimeFormat("en-US", {
  timeZone,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
}).format(instant);
```

Two details worth copying: it returns a `—` placeholder for empty or unparseable values rather than
throwing (it renders unguarded for every row), and it normalizes an ICU `"24"` hour to `"00"`, the same
guard `formatInstantAsMpSql` carries server-side.

### Filtering on a date column in `$filter`

`$filter` strings are also interpreted in MP-TZ. Quote the value and use MP-TZ wall-clock:

```ts
filter: `Contact_Date >= '2026-05-01' AND Contact_Date < '2026-06-01'`
```

Do not convert filter values to UTC. If you have a `Date` instant in JS, run it through `tz.toMpSqlDatetime(instant)` first.

## Anti-patterns

These caused or could have caused the contact-log bug. Grep for them when reviewing new code.

| ❌ Don't | ✅ Do |
| --- | --- |
| ``Contact_Date: `${date}T00:00:00.000Z` `` | `Contact_Date: date` |
| `new Date(formValue).toISOString()` | `await tz.toMpSqlDatetime(formValue)` |
| `new Date(mpValue).getFullYear()` etc. | `await tz.parseMpDatetime(mpValue)` or `Intl.DateTimeFormat({ timeZone })` |
| `new Date(mpValue).toLocaleString(...)` for display | `Intl.DateTimeFormat("en-US", { timeZone: mpTimezone, ... })` |
| Reading domain TZ ad-hoc per request | `DomainTimezoneService.getInstance().getMpTimezone()` (cached) |

The shared signature of these bugs: a `Date` object that crosses a zone boundary silently. Whenever you see `new Date(...)` near an MP read/write, ask "what zone is this assumed to be in, and what zone is the caller expecting back?"

## Windows ↔ IANA zone names

MP's `/domain` endpoint returns `TimeZoneName` as a **Windows** zone (e.g. `"Eastern Standard Time"`). `Intl.DateTimeFormat` requires **IANA** (e.g. `"America/New_York"`). `resolveIanaTimezone` maps between them via the `WINDOWS_TO_IANA` table in `domainTimezoneService.ts` — 137 entries, the standard Windows zone list. If a new MP deployment surfaces an unmapped zone it throws ``Unknown time zone "<name>" — add it to the Windows→IANA mapping in domainTimezoneService.ts``; extend the table rather than silently falling back to the server's local zone.

Resolution order, before the table is consulted:

1. A missing, non-string, empty or whitespace-only value throws `Time zone identifier is required` — a
   different error from the unmapped-zone one, and worth distinguishing when debugging.
2. `"UTC"` and `"Etc/UTC"` both normalize to `"Etc/UTC"`.
3. Anything containing a `/` is assumed to be IANA already and passes through unchanged (test fixtures,
   and MP deployments that return IANA directly).

`resolveIanaTimezone` is exported, so it can be unit-tested without standing up the service.

## Testing

When a test exercises code that goes through `DomainTimezoneService`:

1. **Mock `MPHelper.getDomainInfo`** to return a known `TimeZoneName` — use `vi.hoisted()` because the singleton's `MPHelper` is constructed at module-load time (see CLAUDE.md testing notes).
2. **Reset the singleton** between tests: ``(DomainTimezoneService as any).instance = null``, then take a
   fresh `getInstance()`. The service's internal cache otherwise carries the first test's zone into
   later tests. `domainTimezoneService.test.ts` wraps this in a `freshService()` helper;
   `contactLogService.test.ts` does the null-assignment directly in `beforeEach`. Note that the
   module-level `domainTimezoneService` export is bound at import time, so nulling the static field does
   **not** re-point it — test through `getInstance()`, which is what every caller in `src/` uses.
   `clearCache()` is the non-private alternative when you only need to force a refetch.
3. **Use `mockReset()` (not `clearAllMocks()`)** on the `getDomainInfo` mock. `clearAllMocks` doesn't drain `mockResolvedValueOnce` queues, and tests that don't hit `getMpTimezone()` (date-only wall-clock paths) leave queue entries behind that leak forward.
4. **Run under multiple `TZ` env vars** for any logic that touches dates — at minimum `TZ=UTC` and `TZ=America/Los_Angeles`. The original bug was invisible when developer machines and the server happened to be in the same zone as the MP domain. This is a manual step: nothing in `vitest.config.mts`, `src/test-setup.ts`, the npm scripts or CI pins `TZ` today, so a normal `npm run test:run` only exercises whatever zone the machine is in.

Example mock skeleton:

```ts
const { mockGetDomainInfo } = vi.hoisted(() => ({ mockGetDomainInfo: vi.fn() }));

vi.mock("@/lib/providers/ministry-platform", () => ({
  MPHelper: class { getDomainInfo = mockGetDomainInfo; },
}));

beforeEach(() => {
  mockGetDomainInfo.mockReset();
  mockGetDomainInfo.mockResolvedValue({ TimeZoneName: "America/New_York" });
  (DomainTimezoneService as any).instance = null;
});
```
