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

Use when you need a `Date` instant to do real arithmetic on a value MP returned (date diff, age calculation, comparison). For pure display, prefer `Intl.DateTimeFormat({ timeZone })` against the raw string — it's cheaper and avoids a round-trip through the cached domain info.

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

`datetime-local` emits values like `"2026-05-17T14:30"`. These are **browser-local wall-clock** by definition (no zone). If the user is in the MP timezone, treat as-is. If users may sit in a different zone than the MP domain, capture the browser's IANA zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), submit it with the form, then on the server convert the wall-clock value through that zone first:

```ts
// Treat the user-entered wall-clock as an instant in their zone,
// then re-format in MP-TZ.
const instant = new Date(
  new Intl.DateTimeFormat("en-CA", { timeZone: browserZone /* ... */ }) /* ... */
);
const mpDate = await tz.toMpSqlDatetime(instant);
```

(In practice we only have date-only inputs today. Revisit this when a datetime picker lands.)

### Pre-filling an edit form from a stored MP value

MP returns datetimes as wall-clock strings in MP-TZ (no zone marker). For a date input, take the date portion directly — **do not** parse with `new Date()`:

```tsx
setValue("contactDate", log.Contact_Date.split("T")[0]);
```

### Displaying a stored MP datetime in the browser

`new Date(stringFromMp).toLocaleDateString(...)` parses the string as **browser-local**, which silently disagrees with MP-TZ for users sitting in a different zone. Format with an explicit `timeZone`:

```tsx
function formatMpDateTime(value: string, mpTimezone: string): string {
  // Build the UTC instant that, when rendered in mpTimezone, matches the
  // stored wall-clock. See contact-logs.tsx for the helper.
  // ...
  return new Intl.DateTimeFormat("en-US", {
    timeZone: mpTimezone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}
```

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

MP's `/domain` endpoint returns `TimeZoneName` as a **Windows** zone (e.g. `"Eastern Standard Time"`). `Intl.DateTimeFormat` requires **IANA** (e.g. `"America/New_York"`). `DomainTimezoneService` maps between them via the table in `domainTimezoneService.ts`. If a new MP deployment surfaces an unmapped zone, `resolveIanaTimezone` throws with the unmapped name — extend the table rather than silently falling back to the server's local zone.

IANA names already containing `/` (e.g. test fixtures, some MP deployments) pass through unchanged.

## Testing

When a test exercises code that goes through `DomainTimezoneService`:

1. **Mock `MPHelper.getDomainInfo`** to return a known `TimeZoneName` — use `vi.hoisted()` because the singleton's `MPHelper` is constructed at module-load time (see CLAUDE.md testing notes).
2. **Reset the singleton** between tests: ``(DomainTimezoneService as any).instance = null`` in `beforeEach`. The service's internal cache otherwise carries the first test's zone into later tests.
3. **Use `mockReset()` (not `clearAllMocks()`)** on the `getDomainInfo` mock. `clearAllMocks` doesn't drain `mockResolvedValueOnce` queues, and tests that don't hit `getMpTimezone()` (date-only wall-clock paths) leave queue entries behind that leak forward.
4. **Run under multiple `TZ` env vars** for any logic that touches dates — at minimum `TZ=UTC` and `TZ=America/Los_Angeles`. The original bug was invisible when developer machines and the server happened to be in the same zone as the MP domain.

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
