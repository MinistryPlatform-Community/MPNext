# Downstream Hardening Playbook

**Source:** MPNext, commits `436466d..5bc505a` (2026-09-12), follow-up `65a3225..cf5a824` (2026-09-25)
**Audience:** maintainers of repos that were forked or copied from MPNext
**Status of the source repo after this work:** all findings below closed except F8 (PKCE)

---

## Why you are reading this

MPNext is **forked and copied, not installed from a registry**. There is no
dependency edge from your repo back to it, so no Dependabot alert will ever fire
for any of this. Notification has to be push-based — this file is the push.

On 2026-09-12 a security review of MPNext produced ten findings, nine of which
are now fixed upstream. Most of them are in code that any fork inherited
verbatim: `src/lib/auth.ts`, `src/proxy.ts`, `src/app/api/auth/[...all]/route.ts`,
the service layer, and the (previously empty) `next.config.ts`. Two of the
highest-severity ones — **F-UPDATE-USER** and **F2** — let *any authenticated
user* assume another user's Ministry Platform identity.

On 2026-09-25 a downstream maintainer (Jonathon Huff, The Moody Church)
privately reported two more, both verified upstream: **F3b**, a bypass of the F3
open-redirect fix, and **F12**, an ID-token sign-in path that let an attacker
holding a victim's MP access token sign in *as* that victim. If you already took
the 2026-09-12 fixes, those two sections are the new work. Advisory:
`docs/security/2026-09-25-signin-hardening.md`.

If your fork diverged early, some of these will not apply. Each section starts
with a **"Does this apply to me?"** check you can run in under a minute.

### One instruction that is inverted from the usual advice

For **F-UPDATE-USER**, "update to latest" is the *wrong* instruction.

- A fork whose history **predates `c9d80d4`** (2026-07-09) is **NOT affected** —
  `userGuid` was still `input: false` there, which implicitly guarded the endpoint.
- Merging such a fork forward past `c9d80d4` **without** `436466d` **introduces**
  the vulnerability.

So: check for the *flag*, not the date. Details in F-UPDATE-USER below.

---

## 60-second triage

Run these from your repo root. Any line that prints a **✗** is work for you.

```bash
# F-UPDATE-USER: is /update-user closed?
grep -q "disabledPaths" src/lib/auth.ts && echo "✓ disabledPaths set" || echo "✗ F-UPDATE-USER"

# F2: is implicit account linking disabled, and is email non-authoritative?
grep -q "accountLinking" src/lib/auth.ts && echo "✓ accountLinking configured" || echo "✗ F2 (linking)"
grep -q "syntheticEmailForSub\|mp.invalid" src/lib/auth.ts && echo "✓ synthetic email" || echo "✗ F2 (email as key)"
grep -q "emailVerified: true" src/lib/auth.ts && echo "✗ F2 (hardcoded emailVerified)" || echo "✓ emailVerified from claim"

# F7: is the better-auth catch-all deny-by-default?
grep -q "allowedAuthRoutes" "src/app/api/auth/[...all]/route.ts" && echo "✓ allowlist" || echo "✗ F7"

# F1/F10/F11: do reads go through the role gate, or only a session check?
grep -rln "requireSecurityRole\|hasSecurityRole" src/services/ | wc -l   # expect >1
grep -rn "getSession" src/components/*/actions.ts                        # each hit needs justifying

# F9: are there any security headers at all?
grep -q "headers()" next.config.ts && echo "✓ static headers" || echo "✗ F9 (static)"
grep -q "Content-Security-Policy" src/proxy.ts && echo "✓ CSP" || echo "✗ F9 (CSP)"

# F5: is PII reaching info-level logs?
# (hits inside `@example` JSDoc blocks in helper.ts are documentation, not code)
grep -rn "console\.log\|console\.debug\|console\.info" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "\.test\." | grep -v "/scripts/" | grep -vE ":[0-9]+:[[:space:]]*\*"

# F3: is callbackUrl sanitized before it reaches location.href?
grep -rn "callbackUrl" src/ | grep -i "location.href\|sanitize"
# F3b: the 2026-09-12 sanitizer only checked a leading `//` and `/\` — tab/CR/LF bypass it
grep -rqF 'startsWith("/\\")' src/ && echo "✗ F3b (weak leading-/\\ check)" || echo "✓ no weak check"
grep -rqF '\u001f' src/components/sign-in/ src/app/signin/ 2>/dev/null && echo "✓ control chars refused" || echo "✗ F3b (no control-char rule)"

# F12: is ID-token sign-in refused? (live whenever discoveryUrl is set on better-auth >= 1.7)
grep -q "discoveryUrl" src/lib/auth.ts && ! grep -q "ID_TOKEN_SIGN_IN_DISABLED" src/lib/auth.ts \
  && echo "✗ F12 (no hooks.before idToken guard)" || echo "✓ F12 guard (or no discoveryUrl)"
grep -q "allowedSignInSocialKeys" "src/app/api/auth/[...all]/route.ts" && echo "✓ F12 route filter" || echo "✗ F12 (route filter)"

# F4: can a caller smuggle attribution fields into a write?
grep -rn "Made_By" src/services/ src/components/*/actions.ts
```

---

## The findings

| ID | Sev | What was wrong | Fix commit |
|---|---|---|---|
| **F-UPDATE-USER** | **Critical** | Any authenticated user could POST their own session a different MP `User_GUID` | `436466d` |
| **F2** | **High** | Two MP users sharing an email address merged onto one better-auth user | `85be4b3`, `7da14c5` |
| **F1** | **High** | Contact/log **reads** were gated on "a session exists", which proves nothing | `afef3a9`, `16c3415` |
| **F4** | Medium | Contact-log writes accepted `Made_By` / `Contact_ID` from the caller | `d7adaf8` |
| **F5** | Medium | Member PII and pastoral notes written to logs at info level | `395e20c`, `04e97aa` |
| **F9** | Medium | No CSP, no HSTS, no anti-framing, no Referrer-Policy | `cfeecab`, `67e1329` |
| **F12** | Low (Low–Medium if the OIDC client is shared or allows implicit/hybrid) | `POST /sign-in/social` with an `idToken` body signed the caller in as whoever the supplied access token belonged to (reported 2026-09-25) | `cf5a824` |
| **F3** | Medium | Open redirect via `?callbackUrl=` on `/signin` | `ee46343` |
| **F3b** | Low–Medium | The F3 sanitizer was bypassable with a tab/CR/LF — `?callbackUrl=/%09/example.com` (reported 2026-09-25) | `b7dc8e6` |
| **F7** | Low | ~30 better-auth endpoints publicly mounted; OAuth errors on a third-party page | `91d226f` |
| **F10** | Low | `ContactService.updateContact` wrote with no authorization at all | `16c3415` |
| **F11** | Low | `getMpTimezone` had no check of any kind | `16c3415` |
| **F8** | Low | **Still open** — PKCE is `false` though MP advertises `S256` | — |

Fix order, if you are doing this incrementally: **F-UPDATE-USER → F2 → F12 →
F1 → F4 → F7 → F3/F3b → F5 → F9**. The first four are identity; everything else
is defense in depth on top of them.

---

## F-UPDATE-USER (Critical) — session identity was reassignable

### Does this apply to me?

```bash
grep -n "userGuid" -A3 src/lib/auth.ts | grep "input"
```

- `input: true` **and** no `disabledPaths` in the `betterAuth()` options → **affected**.
- `input: false` → not affected, **but** your sign-in is probably broken on
  better-auth ≥ 1.6 (that flag also strips the field from the OAuth profile
  path). Fix sign-in *and* close the endpoint in the same change.

Confirm on a running instance — signed in as any user:

```js
await fetch('/api/auth/update-user', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userGuid: '<any other MP User_GUID>' })
});
// 404 = fixed.  200/401 = reachable.
```

### What it is

better-auth mounts `/update-user` unconditionally. Its body schema is
`z.record(z.string(), z.any())`, it rejects only `email`, and every other key
goes to `parseUserInput`, which copies any additional field declared
`input !== false` **verbatim, with no validator**, then re-mints the session
cookie from the result. Its only gate is `sessionMiddleware` — satisfied by any
valid session cookie.

Because `userGuid` must stay `input: true` for sign-in to work, the two facts
compose: the attacker inherits the victim's MP roles on every authorization
check and their `User_ID` on every write, so `dp_Audit_Log` attributes the
attacker's actions to the victim.

Being stateless is **not** a mitigation — the handler falls back to
`{ ...session.user, ...additionalFields }` when the adapter returns nothing, so
the value still reaches the cookie.

### Fix

```ts
// src/lib/auth.ts
export const disabledAuthPaths = [
  "/update-user",
  "/change-email",
  "/change-password",
  "/set-password",
  "/delete-user",
  "/delete-user/callback",
  "/link-social",          // has its own id_token branch — see F12
];

const options = {
  // ...
  disabledPaths: disabledAuthPaths,
} satisfies BetterAuthOptions;
```

`disabledPaths` is matched in the router's `onRequest` — before rate limiting,
plugins and `sessionMiddleware` — so these 404 for authenticated and anonymous
callers alike.

### Two non-fixes, so you don't spend an afternoon on them

- **`input: false` is not an alternative.** Since better-auth 1.6 the `input`
  flag governs both "may the provider profile populate this" and "may a user
  POST this". No value satisfies both. Setting it breaks sign-in.
- **A field-level `validator.input` is not an alternative.** It runs on the
  provider-profile path too, so it can constrain the GUID's *shape* but cannot
  distinguish `mapProfileToUser` from an attacker sending a well-formed GUID.

The protection has to live at the endpoint layer.

### Incident response

*Corrected 2026-09-28: this previously said "up to an hour". See the erratum in
`docs/security/2026-09-12-session-identity.md`.*

Patching does **not** revoke sessions already forged. With no database,
better-auth 1.7.4 silently enables `session.cookieCache.refreshCache`, so a
forged `session_data` cookie re-signs itself from the cookie alone on
`/get-session` until the session's `expiresAt` — **up to 7 days after the
original sign-in** on the default config, plus process uptime on a long-running
host whose in-memory row kept sliding `expiresAt`. There is no session table to
clear. **Rotating `BETTER_AUTH_SECRET` is mandatory**: it is the only
revocation that works regardless of config, and it signs every user out.

Check `dp_Audit_Log` for the exposure window of *your* fork — from whenever you
merged `c9d80d4` (or its equivalent) to **at least 7 days after** you deploy
this fix (or to your secret rotation, if sooner).

Then bound future sessions the way upstream did (2026-09-28, `src/lib/auth.ts`):

```ts
session: {
  expiresIn: 12 * 60 * 60,        // absolute; default is 7 days
  disableSessionRefresh: true,    // in-memory row never slides expiresAt
  cookieCache: {
    enabled: true,
    maxAge: 60 * 60,
    strategy: "jwt",
    refreshCache: false,          // MUST be explicit: stateless mode defaults it to true
  },
},
```

With these, no session outlives sign-in + 12 h, and a cookie with no live
in-memory row (copied before sign-out, or forged) dies within 1 h. Upstream's
`src/auth.session-lifetime.test.ts` pins both numbers with a clock walk. Also
make the app refuse to boot without a real secret — better-auth falls back to a
public default outside `NODE_ENV=production` (see `assertAuthEnvironment`).

CVSS 8.1 (`AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`) — computed, not the reflexive
8.8; there is no availability impact. `AC:L` reflects that this codebase treats
GUIDs as non-secret. If in your deployment discovering another user's
`User_GUID` is a genuine barrier, `AC:H` yields 6.8.

Full upstream advisory: `docs/security/2026-09-12-session-identity.md`.

---

## F2 (High) — a shared email merged two people onto one identity

### Does this apply to me?

```bash
grep -n "emailVerified" src/lib/auth.ts     # hardcoded `true`? affected
grep -n "accountLinking" src/lib/auth.ts    # absent? affected
```

### What it is

better-auth's OAuth callback (`oauth2/link-account.mjs`) first matches an account
on `(providerId, sub)`. When none exists it falls back to `findUserByEmail` and,
if both the stored user and the incoming profile are `emailVerified`, links the
new provider account onto the **existing** user and issues a session for that
record.

The original `getUserInfo` hardcoded `emailVerified: true`, so both conditions
always held. `mapProfileToUser` only runs on user *creation*, so the second
person to sign in with a shared email received the first person's `userGuid` and
cached MP `User_ID`: their roles on every authorization check, their `User_ID` on
every write, their profile in the header.

**Ministry Platform enforces no uniqueness on email addresses.** Households
routinely share one across contacts, each of whom may hold a `dp_Users` login.
The in-memory adapter limits blast radius to users who signed in on the same
instance since its last restart; **a persistent database would have made the
collision permanent** — and its unique constraint on `email` would have rejected
the second user outright.

### Fix — two parts, both needed

**Part 1: stop the merge.**

```ts
account: {
  accountLinking: { enabled: false },
},
```

and return the provider's real claim instead of asserting it:

```ts
emailVerified: profile.email_verified === true,   // default false when absent
```

**Part 2: stop keying users on email at all.** Part 1 alone turns a takeover into
a *refusal* — the second user sharing an email is bounced to the error page.
That is better, but it is not correct. The only unique identity MP provides is
`sub` (the `User_GUID`):

```ts
export const SYNTHETIC_EMAIL_DOMAIN = "mp.invalid";   // RFC 2606 reserved TLD

export function syntheticEmailForSub(sub: string): string {
  return `${sub.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

mapProfileToUser: (profile) => {
  const sub = typeof profile.sub === "string" ? profile.sub : "";
  if (!sub) throw new Error("mapProfileToUser: profile has no sub");
  return {
    userGuid: sub,
    email: syntheticEmailForSub(sub),                 // what better-auth stores
    mpEmail: typeof profile.email === "string" && profile.email
      ? profile.email : null,                         // the real address
  };
},
```

Add `mpEmail` as a nullable additional field (MP does not require an email, and
sign-in must not depend on one), and make `userGuid` `required: true` so
`parseInputData` rejects user creation without an MP identity.

Also harden `getUserInfo` to refuse an unusable `sub`:

```ts
let sub: string;
try { sub = sanitizeGuid(String(profile.sub ?? "")); }
catch { /* structured log */ return null; }
```

Return `null`, don't throw — `provider.getUserInfo` is **not** wrapped in a
try/catch in better-auth's callback route, so a throw surfaces as an unhandled
error instead of a clean `unable_to_get_user_info` redirect with no session.

### Downstream consequences to check in your fork

- Anything that displayed `session.user.email` now shows `<guid>@mp.invalid`.
  Point it at `mpEmail` and handle `null`. (Upstream: the header tooltip.)
- If you added a persistent database adapter, existing rows have real emails in
  the `email` column. Plan a migration; do not just deploy this on top.

---

## F1 / F10 / F11 (High → Low) — authentication is not authorization

### Does this apply to me?

If your server actions look like this, yes:

```ts
const session = await auth.api.getSession({ headers: await headers() });
if (!session) throw new Error("Unauthorized");
// ...then read every contact in the domain
```

### What it is

MP's OIDC endpoint authenticates **any** `dp_Users` record, and this app fetches
all MP data with its own client-credentials service account
(`dataplatform/scopes/all`). MP's per-user record security therefore **never
applies** to what the app returns. A session proves only that *some* MP user
signed in. Any MP user in the domain could read every contact's email and phone,
and every pastoral contact log, through this app.

Writes were already role-gated upstream. Reads were not. `ContactService.updateContact`
(F10) had no gate at all, and `getMpTimezone` (F11) had no check of any kind.

### The policy upstream chose

> Any MP user may sign in and use the app shell. The contact features require an
> MP security role.

Sign-in is **deliberately not** role-gated — no check in `getUserInfo`,
`mapProfileToUser`, `customSession` or `AuthWrapper` — so a role-less user still
gets a session, the header, the user menu, and a working **sign-out**. That last
point matters: refusing at sign-in strands users with no way out.

Decide your own policy, but decide it explicitly and write it down.

### Fix — three enforcement layers, because each is independently reachable

A server action is a callable POST endpoint whether or not its page ever
rendered. So gate at all three:

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(web)/<feature>/layout.tsx` | `hasSecurityRole()` → `redirect("/no-access")` |
| Action | `src/components/<feature>/actions.ts` | `requireSecurityRole()` replaces the session check |
| Service | `src/services/*.ts` | `requireSecurityRole()` on every method, reads included |

A layout gate covers its child pages for free — React renders the layout first
and only renders `children` once it returns, so a `redirect()` there means the
page component never runs.

The service copy of `AuthorizationService` is worth lifting wholesale. Key
design points:

```ts
// Per-REQUEST memoization, via React cache() — not a module-level or TTL cache.
// The gate runs at up to three layers per request; this makes that one MP read.
// Nothing crosses requests, which is what keeps a revoked role effective on the
// user's very next request.
const loadSecurityRoles = cache(async (userId: number) => /* dp_User_Roles read */);
```

- **Two entry points.** `requireSecurityRole()` throws `UnauthorizedError` and
  logs a structured denial — it is the enforcement point. `hasSecurityRole()`
  returns a decision without logging — use it for UI affordances and for the
  layout redirect, never as enforcement.
- **Fails closed.** A session whose MP `User_ID` never resolved is refused, as is
  one whose role list cannot be established.
- **Infrastructure failures throw, they do not return `permitted: false`.** A
  caller must never mistake "MP is down" for "this user is not allowed".
- **It returns the acting `User_ID`**, which becomes the single source of write
  attribution (see F4).
- **Config, not code:** `MP_SECURITY_ROLES` (comma-separated). Unset, blank or separator-only (`","`)
  fails closed: nobody is permitted. `*` means "any MP security role will do".
  Changes take effect without a deploy. (Changed 2026-09-28 — blank used to mean "any role".)

**The UX layer is not a security control.** Upstream hides the sidebar entry and
dashboard tile for users without access, so nobody is handed a link that only
redirects them — but the flag (`canAccessContactFeatures`) is computed
**server-side** from the same gate and never derived on the client from role
names, and it is tested to fail closed when the profile or flag is absent.

### Carve-outs, and the rule for adding one

Three upstream call sites touch no per-person MP data and use a plain session
check. Each documents why **in-file**:

- `layout/auth-wrapper.tsx` — it *is* the session gate
- `shared-actions/user.ts` — the user's own profile
- `shared-actions/domain.ts` — the domain-wide time zone (one config string)

Adding a fourth needs the same justification, in the file, in writing.

---

## F4 (Medium) — attribution must be server-authoritative

### Does this apply to me?

```bash
grep -rn "Made_By" src/services/ src/components/*/actions.ts
```

If `Made_By` (or any owner/author/created-by field) arrives inside a payload the
caller controls, you are affected — **even if your TypeScript type omits it**.

### What it is

TypeScript is erased at runtime and a server action is a POST endpoint whose
payload shape the caller controls. Upstream's update path validated with
`ContactLogSchema.omit({ Contact_Log_ID, Contact_Date }).partial()`, which keeps
`Made_By` and `Contact_ID` as *known keys* and passed them straight through to
the PUT.

Any role-holder could therefore re-attribute a pastoral log to a different staff
member, or move it onto a different contact's record, with one crafted request.
MP's audit log recorded the *editor*; the record itself was falsified.

### Fix

Enforce in the **service** — the boundary every path goes through, including
paths that bypass the actions:

```ts
// Gate FIRST. Its return value is the ONLY source of Made_By.
const $userId = await AuthorizationService.getInstance()
  .requireSecurityRole({ table: "Contact_Log", operation: "create" });

// A Zod object parse STRIPS keys it does not declare, so a smuggled key is
// dropped rather than merely untyped.
const validatedRest = ContactLogSchema
  .omit({ Contact_Log_ID: true, Contact_Date: true, Made_By: true })
  .parse(rest);

const record = {
  ...validatedRest,
  Contact_ID: sanitizeNumericId(validatedRest.Contact_ID, "Contact ID"),
  Made_By: $userId,     // LAST, so no spread above can override it
};
```

| Field | Create | Update |
|---|---|---|
| `Made_By` | gate's `User_ID` | gate's `User_ID` |
| `Contact_ID` | caller's subject, `sanitizeNumericId`'d | **never sent** — MP preserves the existing value |

**The actions assemble neither field.** Attribution has exactly one source; two
layers stamping it could drift, and a caller value could slip past whichever was
checked second.

Behavior change worth knowing: `Made_By` on an edited record now reads as
whoever last wrote the row, not necessarily whoever originally made the contact.
That was a deliberate call — MP's audit trail additionally records every edit via
`$userId`.

**Test them as adversarial inputs, not as types.** Drive the service with the
shapes a crafted request can actually send: a smuggled `Made_By` on create and
update, a smuggled `Contact_ID` on update, a non-positive `Contact_ID`. Then
verify the tests fail when you revert the strip — otherwise they merely pass,
they don't protect.

### The general rule

Any value that decides *who did this* or *whose record this is* comes from the
server. Caller-supplied subject IDs are validated (`sanitizeNumericId`), never
trusted.

---

## F5 (Medium) — PII must not reach info-level logs

### Does this apply to me?

```bash
grep -rn "console\.log\|console\.debug\|console\.info" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "\.test\." | grep -v "/scripts/" | grep -vE ":[0-9]+:[[:space:]]*\*"
```

Any hit in a file that touches MP data is a finding. (The last filter drops
`console.log` lines inside `@example` JSDoc blocks — `helper.ts` has several,
and they are documentation, not executable code. Eyeball the remainder rather
than trusting the count.) Hosting and
log-aggregation platforms retain this with **broader access and longer retention
than the MP database itself**.

### What was removed upstream

`$filter` query params and full result sets (names, emails, phones, `Notes`),
PUT request bodies with the full URL, token-validity chatter, stored-procedure
params and results, per-request path logging, client-side `callbackUrl` logging,
and `JSON.stringify` dumps of contact-log records on create/update/delete.

### What was kept, made safe

The rule: **identifiers and shape, never content.**

```ts
// HTTP failures: no response body, no full URL, no query string
console.error("MP request failed", { method, endpoint, status, statusText });

// Caught errors: the message, not the raw object (which may carry a body)
console.error("...", err instanceof Error ? err.message : String(err));
```

Also strip response text out of *thrown* error messages — a GET failure that
appends the response body echoes `$filter` values and record content into every
downstream log and error reporter.

Keep structured events. Upstream has five, and alerts grep on them:

| Event | Emitted when |
|---|---|
| `mp.read.unauthorized` | role gate refuses a read |
| `mp.write.unauthorized` | role gate refuses a write |
| `mp.write.non_user` | a write ran with no resolved acting user |
| `auth.userinfo.invalid_sub` | MP userinfo returned no usable `sub` |
| `auth.userinfo.sub_mismatch` | id_token `sub` missing or not equal to userinfo `sub` (F12) |

### Make it enforced, not advisory

```js
// eslint.config.mjs
{
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/lib/providers/ministry-platform/scripts/**", "**/*.test.{ts,tsx}"],
  rules: { "no-console": ["error", { allow: ["warn", "error"] }] },
}
```

Verify the rule actually fires — add a `console.log` to a `src` file, confirm
eslint flags it, revert. A rule that silently matches nothing is worse than none.

Then add **negative tests**: assert that a failed request's log and thrown
message never contain the response body, the query string, or `Notes`. Those are
the assertions that survive the next refactor.

---

## F9 (Medium) — security headers and a nonce-based CSP

### Does this apply to me?

```bash
cat next.config.ts        # empty config object? affected
```

The session cookie is the only credential this app has, and every page renders
strings that came out of Ministry Platform — so a script injection anywhere is
an immediate session-theft path. This is the defense-in-depth layer under F1/F2/F7.

### The split, and why it is not arbitrary

| Where | Headers | Why there |
|---|---|---|
| `next.config.ts` on `/(.*)` | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (prod only) | Request-independent, and reaches `/api` + the static paths the proxy matcher skips |
| `src/proxy.ts` | `Content-Security-Policy` | The nonce must be fresh per request; a build-time value is a constant an attacker reads off any page |

Anti-framing is expressed **twice on purpose** — `X-Frame-Options` reaches the
routes the proxy skips, `frame-ancestors` covers the rest. They are not both CSP
headers: two `Content-Security-Policy` headers on one response are enforced as an
*intersection*, which is miserable to debug.

HSTS is production-only (`max-age=63072000; includeSubDomains`, **no `preload`** —
that is a one-way submission to a browser-vendor list and the deploying church's
call, not a repo default).

### The CSP, with the loosenings that are deliberate

```
default-src 'self';
script-src 'self' 'nonce-<per-request>' 'strict-dynamic' [dev: 'unsafe-eval'];
style-src 'self' 'unsafe-inline';          ← see below, do NOT add a nonce here
img-src 'self' data: blob: <MP file origin>;
font-src 'self';
connect-src 'self' [dev: ws:];
object-src 'none'; frame-src 'none'; base-uri 'self';
form-action 'self' <MP OAuth origin>;
frame-ancestors 'none';
upgrade-insecure-requests                   ← omit in dev AND in report-only
```

Three loosenings, each with a reason. Do not "tighten" them back into an outage:

1. **`style-src 'unsafe-inline'`, with no nonce.** Radix's dialog pulls in
   react-remove-scroll, which locks body scroll by **injecting a `<style>`
   element** at runtime. That is an element, not an attribute, so `style-src-attr`
   never applies and it falls through to `style-src` — where a nonce cannot
   help, because the element is created by script long after the server chose the
   nonce. A hash is not workable either: the content embeds the computed
   scrollbar width, so it varies by platform and zoom (two different hashes in a
   single page view). **The nonce must stay out of this directive** — CSP3
   browsers ignore `'unsafe-inline'` whenever a nonce sits beside it, which is
   exactly the trap that produced the broken policy. The cost is bounded:
   inline *style* injection permits limited selector-based exfiltration, not
   script execution. `script-src` keeps its nonce and `strict-dynamic`, which is
   the control that matters.
2. **`form-action` includes the MP origin.** Sign-out is a form-driven server
   action ending in a redirect to MP's endsession endpoint, and browsers apply
   `form-action` to the **whole redirect chain**, not just its first hop.
3. **`img-src` includes the MP file origin.** Contact photos are `next/image`
   with `unoptimized`, so the browser fetches them straight from MP.

### Nonces force dynamic rendering — this will break a prerendered page

A page prerendered at build time has no request, so no nonce, so under
enforcement its bootstrap script is blocked and **it never hydrates**. For
`/signin`, which does nothing but run client-side effects, that is a permanent
spinner that never reaches MP.

The trap: **route segment config is IGNORED in a module marked `"use client"`.**
`export const dynamic` sits inert there and the build output still reads `○ /signin`.
The fix is to move the page body into a component and leave the route file a
server component that can actually opt out. Pin **both** the export and the
absence of `"use client"` in tests — either one silently reverts the fix.

Check your own build output for `○` (static) on any route that needs to hydrate.

### Roll it out report-only first — but know what report-only misses

Upstream shipped report-only, walked a **production build** in a real browser
(dev's `'unsafe-eval'`/`'unsafe-inline'` relaxations hide violations), and the
report-only pass was **completely clean**. Enforcing the *same* policy
immediately blocked the injected `<style>` and killed the dialog with React error
#441.

So: report-only is a necessary step, not a sufficient one. Walk sign-in, sign-out,
every image source, and **every Radix surface** (dropdown, dialog, select,
tooltip, drawer) under enforcement before you call it done.

Invert the escape hatch once you do:

```ts
// ENFORCES by default; only the exact string "false" drops to report-only.
export function cspHeaderName(enforce = process.env.CSP_ENFORCE !== 'false') { ... }
```

A typo then fails **loud** (a too-strict header) instead of **silent** (no policy
at all), and report-only becomes the unusual state you switch on to diagnose a
violation — not the state a deploy drifts into by forgetting a variable.

Two mechanics that cost time upstream:

- Next.js does **not** take the nonce from an argument. It re-reads it off the
  **incoming request headers** during render. Set it on the request headers *and*
  the response, or the policy's nonce matches nothing on the page.
- Browsers refuse to honor `upgrade-insecure-requests` in a report-only policy
  and log an error saying so on **every page** — burying the reports report-only
  exists to surface. Omit it whenever the policy is report-only.

---

## F3 / F3b (Medium / Low–Medium) — open redirect via `callbackUrl`

`/signin?callbackUrl=https://evil.example` bounced the user off-site from a URL
that looks like this app's own login page — a credible phishing hop.

### Does this apply to me?

```bash
grep -rn "sanitizeCallbackUrl" -A6 src/components/sign-in/ src/app/signin/
```

No sanitizer → F3. A sanitizer whose only origin checks are
`startsWith("//")` / `startsWith("/\\")` — the version upstream shipped on
2026-09-12 — → **F3b**. Confirm while signed in: visit
`/signin?callbackUrl=/%09/example.com`. Landing on `https://example.com/` means
affected.

### F3b — why the first fix was bypassable

The WHATWG URL parser **strips ASCII tab, LF and CR from anywhere in the input
before it parses** — that is, *after* every string check has already run.
`?callbackUrl=/%09/example.com` decodes to `"/\t/example.com"`, which does not
start with `//` or `/\`, so it passed; `window.location.href` then parsed it as
`//example.com` and sent a signed-in user to `https://example.com/`.

The **signed-out** path was never exploitable — but not because of the
leading-`//` check. There the value travels as `callbackURL` to
`signIn.social`, and better-auth's server-side `isSafeRelativeURL` refuses
control characters and backslashes. The **signed-in** path is a bare
`location.href` assignment with no server in the loop, so the sanitizer is the
*only* check there.

### Fix

Mirror `isSafeRelativeURL`, so client and server agree on what "safe" means (a
URL one accepts and the other rejects strands the user):

```ts
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;   // C0, DEL, C1
const ENCODED_SEPARATOR = /%2f|%5c/i;
const SENTINEL = "https://sentinel.invalid";            // RFC 2606 reserved

export function sanitizeCallbackUrl(raw: string | null | undefined): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "/";
  // `//` is protocol-relative. ANY backslash is refused, not just a leading
  // `/\`: special-scheme URLs treat `\` as `/`.
  if (raw.startsWith("//") || raw.includes("\\") || CONTROL_CHARS.test(raw)) return "/";
  // `%2F`/`%5C` in the PATH can be decoded downstream into a real separator.
  // Query string and fragment are ordinary data.
  const pathEnd = raw.search(/[?#]/);
  if (ENCODED_SEPARATOR.test(pathEnd === -1 ? raw : raw.slice(0, pathEnd))) return "/";
  // Backstop: let the real parser resolve it and insist it stays on-origin.
  try { if (new URL(raw, SENTINEL).origin !== SENTINEL) return "/"; } catch { return "/"; }
  return raw;   // RAW — see below
}
```

**Return the raw value, never the URL-normalized form.** It is tempting to
return `url.pathname + url.search + url.hash` from the backstop "for
tidiness". Don't: dot-segment removal turns `/.//evil.com` into the pathname
`//evil.com` — a fresh protocol-relative redirect manufactured by the
sanitizer itself. Raw `/.//evil.com` resolves safely to this origin's
`//evil.com` path.

**Sanitize at the source, not at each sink.** The value feeds *both* the
`location.href` assignment (where no server is involved at all) and the
`callbackURL` handed to `signIn.social`. Sanitizing once at the read means a
future third use cannot miss it.

Test that legitimate deep links still survive the round trip
(`/contactlookup?x=1`, `/contactlookup/abc?tab=logs`) — a sanitizer that breaks
deep links gets reverted.

Tests worth having, and the mutations that must fail them:

- Drive the hostile cases **through a real query string**
  (`?callbackUrl=/%09/evil.example`, `%0A`, `%0D`), not only as pre-decoded
  strings — the bug lives in the decoding. Also `/\evil.example`, `/a\b`,
  `/%2F/evil.example`, `//evil.example`, `https://evil.example`, and a C1
  character (`\u0085`).
- `/.//evil.example` must come back **unchanged** and resolve to this origin.
- Delete the `CONTROL_CHARS` rule → the tab case must fail. Return the
  normalized form → the `/.//` case must fail. If either still passes, the test
  is not protecting anything.

---

## F7 (Low) — deny-by-default on the better-auth catch-all

better-auth 1.7.4 mounts **~30 HTTP endpoints** under
`export const { GET, POST } = toNextJsHandler(auth)`. The upstream browser client
uses exactly three.

```ts
export const allowedAuthRoutes = {
  GET:  ["/get-session", "/callback/ministry-platform"],
  POST: ["/sign-in/social"],
} as const;
```

Wrap the handler: compute the path relative to `/api/auth` (strip prefix, strip
trailing slashes), **exact string match only — no regex, no prefix matching** —
and return a plain 404 without ever touching better-auth for anything else.

This closes `/get-access-token`, `/refresh-token`, `/list-accounts`,
`/link-social`, `/unlink-account`, `/account-info`, `/list-sessions`,
`/revoke-*`, `/sign-up/email`, `/sign-in/email`, `/update-session`, `/ok`, and
more — including **any endpoint a future better-auth version adds**. That is the
point of deny-by-default, and it is why this is the *primary* control with
`disabledPaths` as defense in depth.

**Enumerate your own client's calls before you copy this list.** If your fork
uses `authClient.signOut()` in the browser, you need `POST /sign-out` here; if it
uses `auth.api.signOut` server-side (as upstream does), you do not — and the 404
makes that omission loud rather than silent.

Two related pieces:

- **Own the OAuth error page.** `onAPIError: { errorURL: "/auth-error" }` sends
  callback failures to your own page instead of better-auth's built-in one
  (which the allowlist no longer exposes). Map known codes
  (`unable_to_get_user_info`, `account_not_linked`, `invalid_code`,
  `state_not_found`, …) to plain-English messages, **never render
  `error_description`**, and always offer a "try again" link with **no
  auto-redirect** — so a failing OAuth loop lands somewhere stable.
- **Allowlist `/auth-error` as public in the proxy.** Without it, an
  unauthenticated visit bounces to `/signin`, which auto-starts OAuth again,
  looping forever. Same for any error page that sits outside your session gate.

---

## F12 (Low) — ID-token sign-in bypassed the code exchange

Reported privately on 2026-09-25 by Jonathon Huff (The Moody Church).
Severity **Medium**; **High** if your MP OIDC client is shared with other
applications or allows the implicit/hybrid flows (both make the attacker's
precondition cheaper).

### Does this apply to me?

```bash
grep -n "discoveryUrl" src/lib/auth.ts                        # set? the branch is live
grep -n "ID_TOKEN_SIGN_IN_DISABLED" src/lib/auth.ts           # absent? affected
grep '"version"' node_modules/better-auth/package.json        # >= 1.7? affected
grep -n "allowedSignInSocialKeys" "src/app/api/auth/[...all]/route.ts"   # absent? layer (a) missing
```

Affected = better-auth ≥ 1.7 **and** `discoveryUrl` set **and** no
`hooks.before` guard. The F7 allowlist does **not** help — the attack goes
through `POST /sign-in/social`, the one POST the allowlist must permit.

Confirm against a **non-production** instance:

```bash
curl -i -X POST https://your-app.example.com/api/auth/sign-in/social \
  -H 'Content-Type: application/json' \
  --data '{"provider":"ministry-platform","idToken":{"token":"x","accessToken":"y"}}'
```

Fixed: a plain **404** from the route before better-auth runs (and, with the
route filter removed, a 404 from the hook with code `ID_TOKEN_SIGN_IN_DISABLED`).
Affected: an error from better-auth's **id-token verification** — which proves
the branch is reachable.

### What it is

better-auth 1.7's `POST /sign-in/social` has an `idToken` branch: body
`{ provider, idToken: { token, accessToken } }` creates a session directly —
no `state`, no authorization code, no exchange. It is enabled for a
genericOAuth provider whenever that provider has an id-token verification
config, which it gets automatically because `auth.ts` sets `discoveryUrl`.
**genericOAuth has no option to turn it off.**

better-auth verifies the id_token (signature, issuer, audience = your
`OIDC_CLIENT_ID`), then calls **our** `getUserInfo` with the
**caller-supplied** `accessToken`. Identity — `sub` → `userGuid` — comes from
MP's `/connect/userinfo` for that access token. **Nothing binds
`id_token.sub` to `userinfo.sub`.**

So: the attacker's *own* valid id_token for this client, plus a victim's MP
access token from **any** MP client that `/connect/userinfo` accepts, yields an
app session **as the victim** — their roles on every authorization check, their
`User_ID` on every write. Reproduced upstream against a mock.

### Fix — three layers

**(b) Primary: refuse the branch in `hooks.before`** (`src/lib/auth.ts`). Hooks
run for HTTP requests *and* in-process `auth.api.*` calls, so this is the one
layer nothing routes around:

```ts
import { APIError, createAuthMiddleware } from "better-auth/api";

hooks: {
  before: createAuthMiddleware(async (ctx) => {
    if (ctx.path !== "/sign-in/social") return;
    const body: unknown = ctx.body;
    // PRESENCE, not truthiness: `idToken: null` / `{}` must not slip past
    if (typeof body === "object" && body !== null && "idToken" in body) {
      // 404, not 400: from outside, this mode simply does not exist here
      throw APIError.from("NOT_FOUND", {
        message: "id_token sign-in is disabled",
        code: "ID_TOKEN_SIGN_IN_DISABLED",
      });
    }
  }),
},
```

**(c) Bind the identity in `getUserInfo`.** Decode `tokens.idToken` (signature
verification is better-auth's job; this is a binding check), and **return
`null`** — fail closed, with a structured `auth.userinfo.sub_mismatch` log — when
its `sub` is missing, not a string, or not equal to userinfo's `sub`. Compare
case-insensitively; GUID case is not significant. Return `null`, don't throw,
for the same reason as F2.

```ts
const idSub = subFromIdToken(tokens.idToken);          // undefined if absent/non-string
if (!idSub || idSub.toLowerCase() !== sub.toLowerCase()) {
  // reason: "missing_id_token" | "undecodable_id_token" | "missing_sub" | "mismatch"
  // identifiers only — never the token or either GUID
  console.error(JSON.stringify({ event: "auth.userinfo.sub_mismatch", reason }));
  return null;
}
```

This also fails the normal code flow closed if MP ever stops returning an
id_token — keep `openid` in the scopes.

**(a) Filter the body at the route** (`src/app/api/auth/[...all]/route.ts`),
on top of the F7 allowlist. For `POST /sign-in/social`:

```ts
export const allowedSignInSocialKeys = ["provider", "callbackURL"] as const;

// Plain 404 (same as a non-allowlisted path) unless ALL hold:
//  - Content-Type media type is exactly `application/json`, and the header
//    contains no comma
//  - the body parses as a JSON object whose keys ⊆ allowedSignInSocialKeys
//  - body.provider === "ministry-platform"
```

The Content-Type rule is not pedantry. better-call matches content type **by
substring**, so a multi-valued header such as
`application/json, application/x-www-form-urlencoded` is parsed by better-auth
as **form data** — a filter that read the body as JSON would be inspecting
different keys from the ones better-auth acts on. Read the body from
`req.clone()` so the handler still gets it.

The subset rule also refuses keys the app never sends — `scopes`,
`errorCallbackURL`, `newUserCallbackURL`, `additionalParams`, `loginHint`,
`additionalData`. On their own those are low impact (origin-checked, or they
only affect the caller's own flow); the point is deny-by-default, same as F7.
**Enumerate your own `signIn.social` call before copying the key list.**

Why all three: (a) is HTTP-only and in-process `auth.api` calls skip it; (b)
depends on better-auth keeping the key named `idToken`; (c) is what still holds
if a future better-auth path reaches `getUserInfo` with caller-supplied tokens.

Considered and **deferred**: dropping `discoveryUrl` would remove the id-token
config and with it the branch — and would also remove boot-time discovery
fragility — but it loses JWKS verification of the normal flow's id_token, and
since 1.7 reads `profile.id` for non-OIDC providers it needs an
`accountSubject` mapping. A separate trade-off, not part of this fix.

### Tests, and the mutations that must fail them

- **Hook:** drive `auth.handler` and `auth.api.signInSocial` with an `idToken`
  body → 404 with code `ID_TOKEN_SIGN_IN_DISABLED`; control: the same call
  without `idToken` still returns an authorization URL.
- **`getUserInfo`:** mismatched `sub` → `null` + event; missing id_token,
  non-string `sub` → `null`; same GUID, different case → accepted.
- **Route:** extra key, `idToken`, wrong `provider`, `text/plain`,
  `application/json, application/x-www-form-urlencoded`, malformed JSON, a JSON
  array → refused **and the better-auth handler never called**;
  `application/json; charset=utf-8` with `{provider, callbackURL}` → reaches it.
- **Test each layer with the other two out of the way** (upstream:
  `src/auth.id-token-sign-in.test.ts`). Three layers tested
  only together prove only the strongest one.
- Delete the hook, replace the `sub` comparison with `true`, drop the comma
  check — each must turn a test red.

---

## F8 (Low) — still open

`pkce: false` in the genericOAuth config, even though MP's discovery document
advertises `code_challenge_methods_supported: ["plain", "S256"]`. It can likely
be flipped to `true`, but that is a separate, separately-testable change from the
1.7 migration itself. It is the natural follow-up to the nonce change below.

---

## Two sign-in bugs you will hit if you touch auth

Not security findings, but both cost hours upstream and both are inherited code.

### MP does not echo the id_token `nonce`

Symptom: `/auth-error?error=unable_to_get_user_info`, with
`id_token failed verification against the discovery JWKS or expected nonce`.

better-auth 1.7 turns nonce binding on automatically for any provider whose
discovery document yields an id_token config, sends a `nonce` on the authorize
request, then requires the claim to come back — `nonceMatches` returns false when
the claim is absent. **MP omits it.** So:

```ts
disableIdTokenNonceBinding: true,
```

What made this look intermittent is inverted from the obvious reading: **sign-in
succeeded only when the boot-time discovery fetch had failed**, because that
leaves the id_token config undefined and skips verification altogether. A
*working* discovery meant a *broken* sign-in.

What you give up: binding the id_token to this particular authorization request.
Signature, issuer and audience are still verified against MP's JWKS. Residual
replay risk is mitigated by the OAuth `state` cookie check and by this being a
confidential client exchanging the code with a client secret. **Enabling PKCE
(F8) narrows it further.**

### A `useState` guard cannot stop a double OAuth flow

Symptom: the same error, intermittently, and two `POST /api/auth/sign-in/social`
in the server log on every attempt.

React StrictMode double-invokes effects in dev. A `useState` flag read inside an
async callback cannot close the window — both runs reach the callback before
`setState` lands, both captured `false` in their closure, both fire. Each call
mints its own `state` and `nonce` and **overwrites the single `oauth_state`
cookie** (`storeStateStrategy: "cookie"`), so the flows race and the loser's
id_token fails.

Use a **ref, checked and set synchronously before the first await**. A ref
survives StrictMode's mount/unmount/remount because the component instance is the
same.

Write the regression test so it **fails against the old implementation** before
you trust it. Upstream also found an existing test that asserted `getSession` was
called *twice* — it had encoded the broken behavior as if it were correct.

---

## Robustness work that landed alongside (worth taking)

### Error boundaries

The app had **none** — no `error.tsx`, no `global-error.tsx`, no `ErrorBoundary`
anywhere. Any throw during a client render replaced the entire page with Next's
default error screen. That was not theoretical: one unparseable datetime blanked
the whole contact page.

Three boundaries, because **placement is the whole design**:

| File | Catches | Why separate |
|---|---|---|
| `src/app/(web)/error.tsx` | anything below the `(web)` layout | renders **inside** the shell, so header, user menu and **sign-out survive** |
| `src/app/error.tsx` | `/signin`, `/session-error`, `/auth-error` | those routes have no shell |
| `src/app/global-error.tsx` | a throw in the root layout itself | replaces it |

`error.tsx` never wraps the layout of its **own** segment, so one boundary will
not do. `src/app/error.tsx` alone would replace the `(web)` shell on any page
error and take the user's sign-out with it — the exact trap `/session-error`
exists to avoid.

Three details that bite:

- **Next 16 renamed the prop to `retry`** (was `reset`). `reset` still exists but
  only clears error state without re-fetching. A boundary wired to the stale name
  renders fine and its button **silently does nothing** — test that `retry` is called.
- **Log identifiers only, never the message.** These boundaries sit above
  components rendering pastoral notes and names; unlike a controlled catch around
  an HTTP call, a render error's message is not guaranteed to be content-free.
  Log `{ boundary, name, digest }` under `ui.render.error`, with `digest` as the
  join key to the un-redacted server log.
- **`global-error.tsx` must import nothing from the app** (whatever failed may be
  that very code, and it does not receive global styles anyway). Its inline
  styling is safe **only because** `style-src` is `'self' 'unsafe-inline'` with no
  nonce — a nonce-based `style-src` would silently drop all of it. The two
  changes are coupled; if you take one, check the other.

`npm run build` is what proves Next accepts these file conventions. A unit test
of the component cannot.

### Four defects that only surfaced under test coverage

Worth checking in your fork, since all four are in inherited components:

1. `formatDateTime()` threw `RangeError` on a blank/unparseable date, unguarded
   during row render — one bad row took out the page. Guard at entry and at the
   `new Date()` fallback, return an em dash. The regression test worth keeping:
   a list where one row's date is bad asserts the **other rows still render**.
2. `contact-lookup-search` never cleared stale results — the empty-query early
   return was dead code because `performSearch` guarded first. Clearing the box
   and pressing Enter left the previous results and count on screen.
3. A failed sign-out was silent — no try/catch on the app's only sign-out path.
   **The fix has a live trap:** `handleSignOut` ends in `redirect()`, and Next 16's
   server-action reducer rejects the action promise with `NEXT_REDIRECT`. A plain
   try/catch therefore alerts `"Error: NEXT_REDIRECT"` on every **successful**
   sign-out. `unstable_rethrow(err)` must be the **first statement in the catch**.
4. Breadcrumbs rendered raw GUIDs. Use a `Map`, not an object literal — the key
   is a raw URL segment, and `/constructor` against a plain object returns an
   inherited `Object.prototype` member as the label.

### Coverage as a gate, not a number

Upstream's headline coverage read 83% while the functional core was near-perfect:
every app route and feature component sat in the denominator at 0% and was
**deliberately ungated**. Closing that took statements 83% → 99%.

The mechanism that matters: a **global** threshold alongside the per-glob ones.
Vitest applies global thresholds to *all* files, even those matched by a glob —
and that is what catches a **new, entirely untested file**. A per-glob gate
cannot, because one new file is diluted by everything already covered in its glob.

**Verify both gates actually fail the run** by forcing them to impossible values.
A green build proves nothing about a threshold that was never exercised.

---

## Config to add

```bash
# Comma-separated MP security role names permitted to use gated features
# (reads AND writes). Blank/unset = nobody (fails closed); "*" = any MP security role.
MP_SECURITY_ROLES=*

# CSP: enforces by default. Only the exact string "false" drops to report-only.
CSP_ENFORCE=

# Needed by the CSP for contact photos (img-src) — you likely already have it
NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL=
```

And in `CLAUDE.md` (or your agent-instruction equivalent), so the rules survive
contact with future contributors and agents:

> - **Authorize, don't just authenticate** — feature server actions **and**
>   service methods that touch MP data call `AuthorizationService`
>   (`requireSecurityRole`, for reads as well as writes), never a bare
>   `auth.api.getSession()` check. List your carve-outs by name.
> - **No debug logging in `src/`** — errors log identifiers (table, IDs, status),
>   never record content, `$filter` strings, or request bodies.
> - **Sanitize every value interpolated into a `$filter`** — including
>   `number`-typed parameters. Types are erased at runtime and server actions are
>   caller-shaped POST endpoints.
> - **better-auth endpoints accept body options the app never sends** — so
>   `POST /sign-in/social` is filtered to known keys at the route, and `idToken`
>   is refused in `hooks.before`. Re-check both on every better-auth upgrade.

---

## Verification checklist

Before you call your fork done:

- [ ] `POST /api/auth/update-user` with a foreign `userGuid` returns **404**
- [ ] `POST /api/auth/list-accounts` (or any non-allowlisted path) returns **404**
- [ ] A non-allowlisted path still routes when you *remove* the allowlist — i.e. you
      verified the negative control, not just that the tests pass
- [ ] `POST /api/auth/sign-in/social` with an `idToken` body returns **404** — at the
      route, and again from the hook (code `ID_TOKEN_SIGN_IN_DISABLED`) with the
      route filter removed
- [ ] The same body sent as `Content-Type: application/json, application/x-www-form-urlencoded`,
      and a body with an extra key (`scopes`), are refused; a normal sign-in still works
- [ ] Signed in, `/signin?callbackUrl=/%09/example.com` **stays on-site** (lands on `/`),
      as do `%0A`, `%0D` and `/.//example.com`; `/contactlookup?x=1` still round-trips
- [ ] Two MP users sharing one real email produce **two distinct** better-auth users
- [ ] A role-less user can sign in, sees the shell, **can sign out**, and is
      redirected from gated pages to an explaining page
- [ ] Calling a gated server action directly (curl/fetch, no page render) is refused
- [ ] A crafted payload with a smuggled `Made_By` is stamped with the caller's
      real `User_ID`, not the smuggled one
- [ ] `grep` for `console.log|debug|info` over non-test, non-script `src/` is empty,
      **and** eslint fails when you add one back
- [ ] A failed MP request's log contains no response body, no query string, no full URL
- [ ] Every header lands against a real `next start` — not only in unit tests
- [ ] Every script tag on your slowest-hydrating page carries the nonce, with none without
- [ ] The enforced-CSP browser walk is clean: sign-in, sign-out, images, and every
      Radix surface
- [ ] `npm run build` succeeds and no route that needs to hydrate is marked static
- [ ] `BETTER_AUTH_SECRET` rotated if you were ever exposed to F-UPDATE-USER

---

## Known-open items upstream (not yet fixed anywhere)

- **F8** — PKCE is `false` though MP advertises `S256`.
- One transient **discovery failure at boot disables the OAuth provider for the
  life of the process**, with no retry. Observed once during the nonce
  investigation; it also inverts the sign-in failure mode (see above).
- `/_not-found` is still prerendered and therefore nonce-less. Accepted: it is
  Next's built-in 404, renders its HTML, and has no interactivity to lose.
- Intermittent MP connectivity from some networks surfaces a
  `ConnectTimeoutError` during a role lookup as a 500. No retry/backoff on that path.
- **F12 residue** — genericOAuth still has no switch for the `idToken` branch; the
  fix *refuses* it rather than removing it. Re-check the hook and the route's
  key list on every better-auth upgrade. Dropping `discoveryUrl` (which would
  remove the branch and the boot-time discovery fragility above, at the cost of
  JWKS verification) is deferred as a separate trade-off.

---

## Reading the upstream work

Each commit message carries the full reasoning — the mechanism, what was ruled
out and how, and which fixes were tried and rejected. They are worth reading
before you adapt any of this to a diverged fork:

```bash
git log --no-merges --reverse 436466d..5bc505a
git log --no-merges --reverse 65a3225..cf5a824   # the 2026-09-25 follow-up
git show 436466d           # F-UPDATE-USER
git show 85be4b3 7da14c5   # F2, both halves
git show afef3a9 16c3415   # F1 / F10 / F11
git show d7adaf8           # F4
git show 395e20c 04e97aa   # F5
git show cfeecab 67e1329   # F9, report-only then enforced
git show 91d226f           # F7
git show ee46343           # F3
git show b7dc8e6            # F3b, control-character bypass
git show cf5a824            # F12, ID-token sign-in refused (hook, userinfo binding, route filter)
git show d201b10 f88a9f1   # the two sign-in root causes
git show 07a2bd9           # error boundaries
```

Reference docs in the upstream repo:

- `.claude/references/auth.md` — the full authorization policy, gate API, and
  closed-findings table
- `.claude/references/security-headers.md` — the header set and the deliberate
  loosenings not to "tighten"
- `docs/security/2026-09-12-session-identity.md` — the F-UPDATE-USER advisory
- `docs/security/2026-09-25-signin-hardening.md` — the F3b / F12 security note
- `SECURITY.md` — how to report a vulnerability privately
- `.claude/references/testing.md` — the mock patterns and jsdom/Radix/React 19
  mechanics this work depended on
