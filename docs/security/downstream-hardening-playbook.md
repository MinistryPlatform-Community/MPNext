# Downstream Hardening Playbook

**Source:** MPNext, commits `436466d..5bc505a` (2026-09-12), follow-up `65a3225..cf5a824` (committed 2026-09-28; reported 2026-09-25), auth review follow-up 2026-09-28/29 (see [2026-09-29 follow-up](#2026-09-29-follow-up))
**Audience:** maintainers of repos that were forked or copied from MPNext
**Status of the source repo after this work:** all findings below closed; F8 (no PKCE / nonce) is an accepted risk

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
# (`^\s*discoveryUrl:` is the config key; the second grep skips a function parameter of that name)
grep -E "^\s*discoveryUrl:" src/lib/auth.ts | grep -qv "discoveryUrl: string" && ! grep -q "ID_TOKEN_SIGN_IN_DISABLED" src/lib/auth.ts \
  && echo "✗ F12 (no hooks.before idToken guard)" || echo "✓ F12 guard (or no discoveryUrl)"
# Issue #101: does one MP blip at boot take sign-in down? (see "Boot-time discovery" below)
grep -E "^\s*discoveryUrl:" src/lib/auth.ts | grep -qv "discoveryUrl: string" && echo "✗ #101 (discovery fetched at boot)" \
  || { grep -q "verifyMpIdToken" src/lib/auth.ts && echo "✓ #101 explicit endpoints + own id_token verification" \
       || echo "✗ no discoveryUrl AND no id_token verification — sign-in is unverified"; }
grep -q "allowedSignInSocialKeys" "src/app/api/auth/[...all]/route.ts" && echo "✓ F12 route filter" || echo "✗ F12 (route filter)"

# F4: can a caller smuggle attribution fields into a write?
grep -rn "Made_By" src/services/ src/components/*/actions.ts
```

---

## The findings

| ID | Sev | What was wrong | Fix commit |
|---|---|---|---|
| **F-UPDATE-USER** | **High** (CVSS 8.1) | Any authenticated user could POST their own session a different MP `User_GUID` | `436466d` |
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
| **F8** | Low | **Accepted risk** — MP supports neither PKCE nor the id_token `nonce`, so nothing binds a code to the browser that started the flow | — |

Fix order, if you are doing this incrementally: **F-UPDATE-USER → F2 → F12 →
F1 → F4 → F7 → F3/F3b → F5 → F9**. The first four are identity; everything else
is defense in depth on top of them.

---

## F-UPDATE-USER (High) — session identity was reassignable

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
    strategy: "jwe",              // encrypted (2026-09-28; was "jwt" — see 2026-09-29 follow-up)
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
| Page | every `page.tsx` that reads MP data | `requireSecurityRole()` before any data call; `UnauthorizedError` → `redirect("/no-access")` |
| Action | `src/components/<feature>/actions.ts` | `requireSecurityRole()` replaces the session check |
| Service | `src/services/*.ts` | `requireSecurityRole()` on every method, reads included |

*Corrected 2026-09-29:* **a layout gate does not protect its child pages.** Next
16 renders each segment independently — the page runs in parallel with the
layout, which only receives a placeholder as `children` — so a `redirect()` in
the layout does not stop the page's data calls or keep their output out of the
RSC payload; layouts are also not re-rendered on client navigation. Upstream's
`contactlookup/layout.tsx` (`hasSecurityRole()` → `redirect("/no-access")`) is a
**UX redirect only**. Each page must gate itself (upstream:
`contactlookup/[guid]/page.tsx`).

The service copy of `AuthorizationService` is worth lifting wholesale. Key
design points:

```ts
// Per-REQUEST memoization, via React cache() — not a module-level or TTL cache.
// During an RSC render (page + the services it calls) this makes the gate one
// MP read. It does NOT dedupe inside a server action — actions run outside a
// React render, so each gate call there is one role read (extra cost, never a
// wrong answer). Nothing crosses requests, which is what keeps a revoked role
// effective on the user's very next request.
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
  Known gap: that holds for the role read, not one step earlier. If the session
  lookup throws, or the `User_ID` could not be resolved at sign-in because MP
  was unreachable (cached as `null` for 30 s), the gate reports `no_mp_user` and
  the user sees "no access" rather than an error. Still fails closed.
- **It returns the acting `User_ID`**, which becomes the single source of write
  attribution (see F4).
- **Config, not code:** `MP_SECURITY_ROLES` (comma-separated). Unset, blank or separator-only (`","`)
  fails closed: nobody is permitted. `*` means "any MP security role will do".
  Changes take effect without a deploy. (Changed 2026-09-28 — blank used to mean "any role".)
  Roles are matched by **name** (trimmed, case-insensitive), not `Role_ID`: MP
  role names are editable and not unique, so anyone who can create, rename or
  assign MP Security Roles can satisfy the gate. Upstream deferred ID matching
  (2026-09-29) — restrict who can edit Security Roles in MP.

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
// dropped rather than merely untyped. Allowlist (pick), not blocklist (omit):
// since 2026-09-28 the cross-record links (Planned_Contact_ID,
// Feedback_Entry_ID, ...) are refused too. Contact_Date is converted separately.
const validatedRest = ContactLogSchema
  .pick({ Contact_ID: true, Contact_Log_Type_ID: true, Notes: true })
  .partial({ Contact_Log_Type_ID: true })
  .parse(rest);

const record = {
  ...validatedRest,
  Contact_ID: sanitizeNumericId(validatedRest.Contact_ID, "Contact ID"),
  Made_By: $userId,     // LAST, so no spread above can override it
};
```

| Field | Create | Update |
|---|---|---|
| `Made_By` | gate's `User_ID` | **never sent** — MP keeps the original author |
| `Contact_ID` | caller's subject, `sanitizeNumericId`'d | **never sent** — MP preserves the existing value |

The update allowlist is only `Contact_Date`, `Contact_Log_Type_ID` and `Notes`.

**The actions assemble neither field.** Attribution has exactly one source; two
layers stamping it could drift, and a caller value could slip past whichever was
checked second.

*Changed 2026-09-28:* the update path used to stamp `Made_By` with the editor,
so any role-holder's trivial edit erased who wrote the note. `Made_By` now means
"who wrote this note" and survives edits; who edited it is recorded in
`dp_Audit_Log` via `$userId`.

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

Keep structured events. Alerts grep on them; the main ones upstream:

| Event | Emitted when |
|---|---|
| `mp.read.unauthorized` | role gate refuses a read |
| `mp.write.unauthorized` | role gate refuses a write |
| `mp.write.non_user` | a write ran with no resolved acting user |
| `auth.userinfo.invalid_sub` | MP userinfo returned no usable `sub` |
| `auth.userinfo.sub_mismatch` | id_token `sub` missing or not equal to userinfo `sub` (F12) |
| `auth.userinfo.id_token_claims_invalid` | id_token `exp` missing, or `azp` wrong (2026-09-28; a past `exp` is now refused by jose — `id_token_unverified`) |
| `auth.userinfo.id_token_unverified` | id_token could not be verified: `reason` `verifier_unavailable` (discovery did not load) or `verification_failed` with jose's `code`/`claim` (issue #101, 2026-09-29) |
| `auth.userinfo.fetch_failed` | userinfo request failed, timed out or redirected (2026-09-28) |
| `auth.oidc.discovery_failed` | MP's discovery document did not load at the callback: `reason` `http_status`, `request_failed`, `invalid_json` or `invalid_document` (+ `field`) (issue #101, 2026-09-29) |
| `auth.session.user_id_unresolved` | `dp_Users` lookup for the session's `User_ID` failed (2026-09-28) |

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
| `next.config.ts` on `/(.*)` | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, HSTS (prod only) | Request-independent, and reaches `/api` + the static paths the proxy matcher skips |
| `src/proxy.ts` | `Content-Security-Policy` | The nonce must be fresh per request; a build-time value is a constant an attacker reads off any page |

Anti-framing is expressed **twice on purpose** — `X-Frame-Options` reaches the
routes the proxy skips, `frame-ancestors` covers the rest. They are not both CSP
headers: two `Content-Security-Policy` headers on one response are enforced as an
*intersection*, which is miserable to debug.

HSTS is production-only (`max-age=63072000; includeSubDomains`, **no `preload`** —
that is a one-way submission to a browser-vendor list and the deploying church's
call, not a repo default). "Production" means a production *build*: `next build`
bakes it in, so a local `next start` sends it too.

Also in `next.config.ts` (added 2026-09-29): `poweredByHeader: false`,
`images.unoptimized: true` (the image optimizer is off; nothing uses it), and
`logging.serverFunctions: false` (stops `next dev` logging server-action
arguments — member data — to the terminal). The `/api/auth` route sends
`Cache-Control: no-store` on every response.

### The CSP, with the loosenings that are deliberate

```
default-src 'self';
script-src 'self' 'nonce-<per-request>' 'strict-dynamic' [dev: 'unsafe-eval'];
style-src 'self' 'unsafe-inline';          ← see below, do NOT add a nonce here
img-src 'self' data: blob: <MP file origin>;
font-src 'self';
connect-src 'self' [dev: ws:];
object-src 'none'; frame-src 'none'; base-uri 'none';
form-action 'self' <MP OAuth origin>;
frame-ancestors 'none';
upgrade-insecure-requests                   ← omit in dev AND in report-only
```

Three loosenings, each with a reason. Do not "tighten" them back into an outage:

1. **`style-src 'unsafe-inline'`, with no nonce.** Radix's dialog pulls in
   react-remove-scroll, which locks body scroll by **injecting a `<style>`
   element** at runtime. That is an element, not an attribute, so `style-src-attr`
   never applies and it falls through to `style-src`. A hash is not workable:
   the content embeds the computed scrollbar width, so it varies by platform and
   zoom (two different hashes in a single page view). **The nonce must stay out
   of this directive** — CSP3 browsers ignore `'unsafe-inline'` whenever a nonce
   sits beside it, which is exactly the trap that produced the broken policy.
   *Corrected 2026-09-29:* a nonce *could* cover that element —
   react-remove-scroll gets its nonce from `get-nonce`, so calling its
   `setNonce()` with the request nonce would work. Upstream **accepted**
   `'unsafe-inline'` instead, for simplicity (it is also what lets
   `global-error.tsx` use inline styles; see Error boundaries). The cost is
   small: inline *style* injection cannot run script, and the usual CSS
   exfiltration channels are closed because `img-src` and `font-src` allow no
   attacker origin. `script-src` keeps its nonce and `strict-dynamic`, which is
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
Upstream turns that into a CI failure: `scripts/check-prerender.mjs`
(`npm run build:check-prerender`) reads `.next/prerender-manifest.json` and
fails on any static route except `/_not-found` and `/_global-error`. Those two
cannot opt out; `global-error.tsx` is written to work without JavaScript (a
plain `<a href="/">`, and its retry button renders only once hydrated).

### Roll it out report-only first — but know what report-only misses

Upstream shipped report-only, walked a **production build** in a real browser
(dev's `'unsafe-eval'` and `ws:` relaxations hide violations), and the
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

There is **no `report-uri`/`report-to`**: violations appear only in the
viewer's browser console, so a blocked script in production is invisible to
you. Upstream decided (2026-09-29) to ship no reporting endpoint — a known gap.
Add one if you have somewhere to send reports.

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
  looping forever. Same for any error page that sits outside your session gate (upstream also: `/signed-out`).

---

## F12 (Low) — ID-token sign-in bypassed the code exchange

Reported privately on 2026-09-25 by Jonathon Huff (The Moody Church).
Severity **Low**; **Low–Medium** if your MP OIDC client is shared with other
applications or allows the implicit/hybrid flows (both make the attacker's
precondition cheaper) — as rated in the advisory.

### Does this apply to me?

```bash
grep -nE "^\s*discoveryUrl:" src/lib/auth.ts | grep -v "discoveryUrl: string"   # set? the branch is live
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
config, which it gets automatically when `auth.ts` sets `discoveryUrl`.
**genericOAuth has no option to turn it off.** (Upstream `main` stopped
setting `discoveryUrl` in issue #101, so the branch is off there as well — see
[Boot-time discovery](#boot-time-discovery-issue-101) — but the guard below is
kept as the primary control.)

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

Dropping `discoveryUrl` was **deferred** here, because it loses genericOAuth's
JWKS verification of the normal flow's id_token. It was **done in issue #101**
(2026-09-29): the app now verifies the id_token itself, with the same jose call,
and maps `accountSubject` to `sub`. That removes the boot-time dependency on
discovery, and the branch goes with it. See
[Boot-time discovery](#boot-time-discovery-issue-101). Keep (a)–(c) anyway,
since re-adding `discoveryUrl` would switch the branch straight back on.

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

## F8 (Low) — accepted risk

*Corrected 2026-09-29: this previously called PKCE a likely follow-up.*

`pkce: false` in the genericOAuth config is **required**, not pending: Ministry
Platform does not support PKCE, even though its discovery document lists
`code_challenge_methods_supported`. better-auth 1.7 defaults `pkce` to `true`,
so keep it explicitly `false`. MP also omits the id_token `nonce` (below).

Stated plainly: with neither, **nothing binds an authorization code to the
browser that started the flow**. An attacker who obtains a victim's code starts
their *own* flow — with their own valid `state` cookie — and injects the
victim's code; the app redeems it with its own client secret and signs the
attacker in as the victim (authorization-code injection, RFC 9700 §4.5;
reproduced upstream against a mock OIDC provider). Neither the `state` check
nor being a confidential client stops that. The OAuth `state` is also not one-time
use in cookie mode — the same cookie/state pair validates any number of
callbacks for its 10 minutes — which makes a replay cheaper; only a server-side
state store (`storeStateStrategy: "database"` + `secondaryStorage`) fixes that.

Upstream accepts this. The remaining defences keep codes out of an attacker's
reach: a **dedicated MP OIDC client** for this app with exact redirect URIs
(not shared with other apps), `Referrer-Policy`, and no code-bearing URLs in logs.

---

## Two sign-in bugs you will hit if you touch auth

Not security findings, but both cost hours upstream and both are inherited code.

### MP does not echo the id_token `nonce`

Symptom: `/auth-error?error=unable_to_get_user_info`, with
`id_token failed verification against the discovery JWKS or expected nonce`.

better-auth 1.7 turns nonce binding on automatically for any provider whose
discovery document yields an id_token config, sends a `nonce` on the authorize
request, then requires the claim to come back — `nonceMatches` returns false when
the claim is absent. **MP omits it.** So, while your config sets `discoveryUrl`:

```ts
disableIdTokenNonceBinding: true,
```

Upstream no longer needs this. Since issue #101 it sets no `discoveryUrl`, so the
provider has no id_token config and nonce binding is off structurally (see
[Boot-time discovery](#boot-time-discovery-issue-101)). If you port that, drop
both options. If you keep `discoveryUrl`, keep both this and
`requireIdTokenVerification: true`.

What made this look intermittent is inverted from the obvious reading: on
better-auth before 1.7.3, **sign-in succeeded only when the boot-time discovery
fetch had failed**, because that left the id_token config undefined and skipped
verification altogether. A *working* discovery meant a *broken* sign-in. On
1.7.4 a failed discovery skips the provider instead (sign-in 404s
`PROVIDER_NOT_FOUND`), and `requireIdTokenVerification: true` refuses a
discovery document missing `issuer` or `jwks_uri` rather than silently skipping
verification.

What you give up: binding the id_token to this particular authorization request.
Signature, issuer and audience are still verified against MP's JWKS. The
`state` cookie check and the client secret do **not** cover the gap, and PKCE
is not available from MP — see F8 above: this is an accepted risk.

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
| `src/app/error.tsx` | `/signin`, `/signed-out`, `/session-error`, `/auth-error` — **and** a throw in the `(web)` shell itself (its layout, the Header) | those routes have no shell; for a shell failure it is the nearest boundary above, so it offers a sign-out button — the user may still be signed in |
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
- **`global-error.tsx` must work without JavaScript.** Next prerenders it as
  `/_global-error` (the static 500 page), so it has no nonce and never hydrates
  under the enforced CSP — and as a client component it cannot opt out. Make
  the recovery control a plain `<a href="/">`, and render any `retry()` button
  only after hydration.

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

# Required since 2026-09-29: the app's origin, https for every real host
# (loopback http allowed). Also the exact post-logout redirect URI.
BETTER_AUTH_URL=
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
      (upstream: `npm run build:check-prerender`)
- [ ] Every page that reads MP data gates itself — delete a layout's gate and a
      direct request for the page is still refused
- [ ] `BETTER_AUTH_SECRET` rotated if you were ever exposed to F-UPDATE-USER
- [ ] With MP unreachable (or hanging) when the app starts, `POST /api/auth/sign-in/social`
      still returns 200 immediately, and a sign-in after MP recovers succeeds without a
      restart (issue #101)

---

## 2026-09-29 follow-up

A second auth review (2026-09-28) found no Critical or High issues; the
2026-09-12 and 2026-09-25 fixes all held. Its fixes landed on 2026-09-28/29
(`dev/security-review-2026-09-28`). Worth taking, in brief:

- **MP HTTP client:** timeouts on every MP fetch (10 s token, 20 s API, 60 s
  upload) and `redirect: "error"`; single-flight token refresh with response
  validation and a lifetime clamp; a 401 refreshes the token and retries once;
  `buildUrl` refuses `..`, `?`, `#`, `\`, encoded separators and control
  characters in endpoint paths; errors log names only.
- **Provider services:** table/procedure names, IDs and GUIDs validated and
  each path segment encoded; `$ignorePermissions` removed; codegen escaping.
- **Auth core:** `requireIdTokenVerification: true` (superseded by issue #101
  below); id_token `exp`/`azp` checks; userinfo never throws (timeout, no redirects); `session_data` is
  encrypted (JWE); `User_ID` lookup failures negative-cached (30 s / 5 min);
  `token`, `ipAddress` and `userAgent` stripped from `/get-session`; startup
  guard on the secret; `AUTH_IP_ADDRESS_HEADERS` / `AUTH_TRUSTED_PROXIES` for
  rate-limit IPs; 4 KB body cap on `/sign-in/social`.
- **App services:** allowlists for contact-log and contact writes; `Made_By`
  kept on update (see F4); `getUserProfile` self-only; LIKE `[` escaping and a
  100-char search cap; no caller input echoed into errors or logs.
- **HTTP boundary:** Content-Type checked on the raw header; `/api` matched
  exactly (not `/apifoo`) and the proxy matcher anchored; `no-store` on auth
  routes; COOP/CORP, `base-uri 'none'`, no `X-Powered-By`, image optimizer off,
  `logging.serverFunctions: false` (see F9).
- **Auth UI:** `/auth-error` shows only allowlisted codes; `/signin` error
  states and a restart cap; sign-out always reachable; `global-error` works
  without JS; each page self-gates (see F1); a public `/signed-out` page that
  never starts OAuth, where ended sessions and cross-tab sign-out land.
- **CI / setup:** actions pinned by SHA with `permissions: contents: read`;
  lint + `tsc`, build + prerender-check jobs; `.env.local` written escaped and
  0600; `npm ci`, no `npm update`.
- **Env validation + discovery:** `src/lib/env.ts` validates both URLs at
  startup. A failed discovery no longer disables sign-in for the life of the
  process. This first landed as a self-healing rebuild of the `auth` instance,
  and was then replaced by removing boot-time discovery altogether — see
  [Boot-time discovery](#boot-time-discovery-issue-101).
- **Tests:** a mock OIDC provider (`src/test-utils/mock-oidc.ts`) drives the
  real code flow; origin check, session config, rate limit and the discovery
  outage (`src/auth.oidc-discovery.test.ts`) each have a suite that a mutation
  turns red.
- **Dependencies:** Next 16.3.7 (GHSA-vcvr-r3jv-pc5j); `import "server-only"`
  in `auth.ts`, the MP client and every service.

A step-by-step port of all of this, with a triage script, per-phase checks
and a verification list, is in `.claude/playbooks/port-security-review-2026-09-28.md`
(written for Claude Code, readable by people).

**Breaking for forks** — check each before merging:

- The session user no longer has `firstName`/`lastName`; read names from the MP
  profile.
- `MPHelper.createCommunication` / `sendMessage(content, sender, attachments?)`
  take a required, trusted sender (build it from `requireSecurityRole`'s
  `User_ID`, never from the caller).
- Stored procedures are deny-all: `executeProcedure(WithBody)` refuses any name
  not passed as `new MPHelper({ allowedProcedures: [...] })`.
- `getCurrentUserProfile` returns the six-field `CurrentUserProfile`
  (`First_Name`, `Nickname`, `Last_Name`, `Email_Address`, `Image_GUID`,
  `canAccessContactFeatures`) — no roles, groups, IDs or phone.
- `BETTER_AUTH_URL` (or `NEXTAUTH_URL`) is required, origin only, and https for
  every real host; loopback `http` is allowed. The MP base URL must be https
  (loopback `http` outside production only).
- `server-only` guards: importing `auth.ts`, the MP client or a service from a
  client component now fails `next build`.
- `mp:generate*` must run `tsx --conditions=react-server`; plain `tsx` fails.
- The cookie-cache strategy change (JWT → JWE) invalidates every existing
  `session_data` cookie once, on deploy. Where no in-memory session row backs
  the request (a new process or another instance), those users sign in again.

### Boot-time discovery (issue #101)

Reported 2026-09-29 by Jonathon Huff (The Moody Church). With `discoveryUrl`
set, genericOAuth fetches MP's discovery document **once**, inside the auth
context's `init`, with no timeout and no retry, and every auth request awaits
that `init`. Every in-process `auth.api.*` call awaits it too, which means every
page's session check.

- A **failed** fetch drops the provider: `/sign-in/social` returns `404
  PROVIDER_NOT_FOUND`, and `/signin` spins, until a restart. The rebuild facade
  above healed this after a 30 s cooldown.
- A **hung** fetch stalls every request for undici's ~300 s headers timeout.
  The facade did not cover this case.

`/signin` still returns 200, so an uptime check stays green.

**Does this apply to me?** It applies if `grep -nE "^\s*discoveryUrl:"
src/lib/auth.ts | grep -v "discoveryUrl: string"` prints (the second grep skips
a function parameter of that name). It is worse without the facade.

**Upstream fix:** no `discoveryUrl`. Explicit `authorizationUrl`, `tokenUrl` and
`endSessionEndpoint`, plus `accountSubject: ({ profile }) => profile.sub`.
`getUserInfo` verifies the id_token itself (`verifyMpIdToken`: jose `jwtVerify`,
RS256 only, `iss`/`aud`) against an issuer and JWKS that `lazyIdTokenVerifier`
loads from discovery **at the first callback**:

- 5 s timeout;
- cached on success, never on failure;
- single-flight.

Building the instance, `next build`, cold starts and session checks make no MP
call. An MP outage now fails only the sign-in whose callback hits it, and the
next sign-in recovers. It also removes the F12 branch at the source, because
the provider has no id_token config, and nonce binding goes the same way. Step
by step, including what to delete if you ported the rebuild facade:
`.claude/playbooks/port-security-review-2026-09-28.md` Phase 4.

---

## Known-open items upstream (not yet fixed anywhere)

- **F8 (accepted)** — MP supports neither PKCE nor the id_token `nonce`, so
  authorization-code injection is unmitigated; defences are a dedicated OIDC
  client, `Referrer-Policy` and code-free logs. OAuth `state` is not one-time
  use in cookie mode; only a server-side state store fixes that.
- **Sign-out does not revoke a copied session (accepted 2026-09-29)** — up to
  1 h after sign-out, 12 h on an instance that never saw it; the 12 h cookie is
  persistent. See `docs/security/Additional_Security_Hardening.md` §1.
- **Deleting or disabling an MP login** does not end a live app session before
  the 12 h cap; **the role gate** ignores table/operation and MP's own rights.
  Decisions pending — `Additional_Security_Hardening.md` §2–§3.
- **Roles are matched by name (deferred 2026-09-29)** — restrict who can edit MP
  Security Roles.
- **No CSP reporting endpoint (decided 2026-09-29)** — violations show only in
  the browser console.
- `/_not-found` and `/_global-error` are prerendered and therefore nonce-less.
  Accepted: neither can opt out; `/_not-found` has no interactivity to lose and
  `/_global-error` recovers via a plain link. `scripts/check-prerender.mjs`
  fails CI on any other static route.
- An MP timeout during a role lookup now fails after 20 s to the error boundary
  rather than hanging. There is still no retry/backoff on that path.
- **F12 residue** — genericOAuth still has no usable switch for the `idToken`
  branch; the fix *refuses* it rather than removing it. better-auth's
  `disableIdTokenSignIn` is not an alternative: the normal code flow calls the
  same `verifyProviderIdToken`, which returns `false` when that flag is set, so
  it would break every sign-in. Re-check the hook and the route's key list on
  every better-auth upgrade. **Largely closed by issue #101 (2026-09-29):** the
  provider has no `discoveryUrl`, and so no id_token config, which means
  better-auth refuses the branch itself (`ID_TOKEN_NOT_SUPPORTED`). JWKS
  verification is kept, because the app now does it. The hook stays, since
  re-adding `discoveryUrl` would switch the branch back on.
- **better-auth's own logger** still logs callback `error`/`state`/`iss`/
  `callbackURL` values verbatim (accepted; a custom `logger` would fix it).

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
