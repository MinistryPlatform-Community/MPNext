# Security Advisory — Session identity could be reassigned via `/update-user`

| | |
|---|---|
| **Severity** | **High** — CVSS 3.1 base **8.1** (`AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`) |
| **Class** | CWE-639 Authorization Bypass Through User-Controlled Key / CWE-863 Incorrect Authorization |
| **Affected** | Any checkout containing [`c9d80d4`](https://github.com/MinistryPlatform-Community/MPNext/commit/c9d80d4) (2026-07-09) and **not** [`436466d`](https://github.com/MinistryPlatform-Community/MPNext/commit/436466d) |
| **Not affected** | Anything before `c9d80d4` — see [Am I affected?](#am-i-affected) |
| **Fixed in** | [`436466d`](https://github.com/MinistryPlatform-Community/MPNext/commit/436466d) (2026-09-12) |
| **Reported** | Privately, by a downstream maintainer who found it in their own fork |
| **Erratum** | 2026-09-28 — a forged session survives the patch for up to **7 days**, not one hour; rotating `BETTER_AUTH_SECRET` is **mandatory**. See [Erratum](#erratum-2026-09-28) |

## Summary

Any **authenticated** user could reassign their own session's Ministry Platform
identity to that of any other user whose `User_GUID` they knew, by POSTing to a
Better Auth endpoint that MPNext left exposed. The forged identity was then
honored by every downstream authorization check and written into the Ministry
Platform audit trail.

This is a privilege escalation, not a data-exposure bug: the attacker does not
read something they shouldn't — they **become** someone else.

## Impact

Once a session carried a victim's `User_GUID`:

- **Authorization** — MPNext resolves the acting MP profile from the session's
  `userGuid`, so the attacker inherited the victim's MP **roles and user groups**
  on every check that followed.
- **Audit-trail forgery** — MP writes carry the acting user's `User_ID`, so
  `dp_Audit_Log` attributed the attacker's creates, updates and deletes **to the
  victim**. Attribution during an exposure window cannot be trusted on its face.
- **Data** — anything the victim could read or change, the attacker could.

Escalating to an administrator's `User_GUID` yields administrative reach.

## Am I affected?

**The usual advice is inverted here — "update to latest" is wrong.** This is a
template repository that people fork and copy, so the affected set is a *commit
range*, not a version range.

```bash
# Affected if the first prints and the second does not.
git merge-base --is-ancestor c9d80d4 HEAD && echo "has the flaw"
git merge-base --is-ancestor 436466d HEAD && echo "has the fix"
```

| Your fork | Status |
|---|---|
| Branched **before** `c9d80d4` (2026-07-09) | **Not affected.** Do not "update to latest" reflexively — merging forward past `c9d80d4` without `436466d` would *introduce* the flaw. |
| Contains `c9d80d4`, not `436466d` | **Affected.** Apply the fix. |
| Contains `436466d` | Fixed. Read [After patching](#after-patching) — the patch alone does not revoke sessions already forged. |

A quick runtime check against a **non-production** instance, signed in as any
user — a fixed deployment returns **404**:

```bash
curl -i -X POST https://your-app.example.com/api/auth/update-user \
  -H 'Content-Type: application/json' --data '{}'
```

`401` means the endpoint is live and only session-gated — you are affected.

## Technical detail

Better Auth mounts `POST /update-user` unconditionally. Its body schema is
`z.record(z.string(), z.any())`; it rejects only `email` and passes every other
key to `parseUserInput`, which copies any user additional field declared
`input !== false` **verbatim, with no validator**, then re-mints the session
cookie from the result. Its only gate is `sessionMiddleware`, which any valid
session cookie satisfies.

MPNext declares `userGuid` (the MP `User_GUID` / OAuth `sub`) as a user
additional field, and it **must** stay `input: true` — as of Better Auth 1.6,
`parseAdditionalUserInputFromProviderProfile` strips `input: false` fields
*before* the user record is created, so `input: false` silently empties
`userGuid` and breaks sign-in entirely.

Those two facts compose into the vulnerability:

```js
// Run by any signed-in user, in their own browser console.
await fetch('/api/auth/update-user', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userGuid: '<target MP User_GUID>' })
});
```

**The stateless setup is not a mitigation.** With no database the adapter update
returns nothing, and the handler falls back to
`{ ...session.user, ...additionalFields }` — so the attacker-supplied value still
lands in the cookie.

### On the precondition

Exploitation requires knowing a target's `User_GUID`. That is a stable,
non-secret, non-rotatable value, and this codebase already treats GUIDs as
non-secret — `src/components/shared-actions/user.ts` notes they "appear in the
client session and in `/contactlookup` URLs." The population that can read
`dp_Users` overlaps heavily with the population that can sign in. CVSS is scored
`AC:L` on that basis; if you consider GUID discovery a genuine barrier in your
deployment, `AC:H` yields **6.8 Medium**.

## The fix

[`436466d`](https://github.com/MinistryPlatform-Community/MPNext/commit/436466d)
closes the endpoint at the router layer:

```ts
disabledPaths: [
  "/update-user", "/change-email", "/change-password",
  "/set-password", "/delete-user", "/delete-user/callback",
],
```

Better Auth matches `disabledPaths` in the router's `onRequest` — before rate
limiting, plugins and `sessionMiddleware` — so these return **404** to
authenticated and anonymous callers alike. `/change-email` and friends are closed
because identity here belongs to Ministry Platform; MPNext does no self-service
account management and calls none of them.

> **Do not "fix" this with `input: false`.** It breaks sign-in. As of Better Auth
> 1.6 the `input` flag governs *both* "may the OAuth provider profile populate
> this" (needs `true`) and "may a user POST this" (needs `false`), and no value
> satisfies both — so the protection cannot live on the field. A field-level
> `validator.input` does not work either: it runs on the provider-profile path
> too, so it can constrain the GUID's *shape* but cannot distinguish
> `mapProfileToUser` from an attacker sending a well-formed GUID.

`src/auth.test.ts` asserts **both halves** — that `userGuid` stays writable *and*
that the paths 404 — plus a control proving a non-disabled path still routes, so
the suite cannot pass vacuously. Removing either protection fails the build.

### Since hardened further

`91d226f` (2026-09-12, after the fix) added a **deny-by-default allowlist** in
`src/app/api/auth/[...all]/route.ts`: only `GET /get-session`,
`GET /callback/ministry-platform` and `POST /sign-in/social` reach
`auth.handler` at all; everything else 404s at the HTTP boundary, including any
endpoint a future Better Auth version adds. `disabledPaths` remains as defense
in depth, and is still what `src/auth.test.ts` exercises (that suite drives
`auth.handler` directly, bypassing Next.js routing). **The allowlist is an
addition, not a replacement — do not drop `disabledPaths` on the strength of
it.** A fork that takes only `436466d` is fully patched for this advisory.

## After patching

**Closing the endpoint stops new forgeries. It does not revoke one already minted
into a cookie.**

> **Corrected 2026-09-28** — see [Erratum](#erratum-2026-09-28). This section
> originally said a forged session lasted "up to one hour" and that rotating the
> secret was optional. Both were wrong.

A session tampered with before the patch keeps its forged `userGuid` in its
session cookie until that session's `expiresAt` — **up to 7 days after the
original sign-in**, not one hour. With no database, better-auth silently enables
`session.cookieCache.refreshCache`, so every `/get-session` call in the last
~12 minutes of each hour re-signs the forged `session_data` from the cookie
itself, with no store lookup, until `expiresAt`. On a long-running self-hosted
process that was never restarted, the in-memory session row carried the forged
user too and slid `expiresAt` forward daily — add the process uptime. With no
database there is no server-side session store to clear.

1. Treat **up to 7 days** after deploy (plus process uptime on long-running
   hosts) as still-exposed for any already-forged session, unless the secret is
   rotated.
2. **Rotate `BETTER_AUTH_SECRET` — mandatory, not optional.** It is the only
   revocation that works on every deployment. It invalidates every session
   cookie at once; all users must sign in again.
3. Review `dp_Audit_Log` for the exposure window **plus at least the 7 days
   after deploy** (or up to the rotation, if sooner). Writes made through a
   forged session carry the **impersonated** user's `User_ID`, so look for
   activity inconsistent with the named user's role, hours, or normal behavior.

## Erratum (2026-09-28)

The original "After patching" guidance reasoned from `cookieCache.maxAge: 3600`
and told forks to treat one hour after deploy as exposed, with secret rotation
presented as an option. A 2026-09-28 auth review found better-auth's stateless
defaults (`node_modules/better-auth/dist/context/create-context.mjs`) merge
`refreshCache: true` under the app's cookie-cache config, so a forged or copied
cookie re-mints itself until `session.expiresAt` — 7 days by default. Verified
on better-auth 1.7.4 by a clock-walk test against the real `auth` instance
(`src/auth.session-lifetime.test.ts`, negative control: a copied cookie pair
still valid at 6.98 days, first refused at 7.01 days). Not verified on the
1.6.23 / 1.7.1 / 1.7.2 versions the exposure window spanned; assume the same.

**If you acted on the original text:** if you rotated `BETTER_AUTH_SECRET`
after deploying the fix, you are covered — rotation invalidated every forged
cookie regardless of this correction. If you did not rotate, rotate now unless
more than 7 days have passed since you deployed the fix *and* your process has
been restarted since (a restart ends in-memory rows); in either case, widen your
`dp_Audit_Log` review to at least the 7 days after your deploy.

Upstream has since bounded session lifetime for sessions minted from now on:
12 hours absolute, never extended, and `refreshCache: false` so a cookie with no
live server-side row dies within an hour. Deploying those settings also ends any
remaining forged cookie within an hour of the deploy. See
`.claude/references/auth.md` § Session lifetime and revocation.

## Timeline

| Date | Event |
|---|---|
| 2026-02-20 | `bf0bd13` — Better Auth migration. `userGuid` declared `input: false`; `/update-user` answers `400 — userGuid is not allowed to be set`. **Not vulnerable.** |
| 2026-05-16 | `473967d` — an unrelated dependency upgrade takes better-auth 1.5.5 → 1.6.11 in the lockfile. 1.6 strips `input: false` provider-profile fields; **sign-in breaks**. Broken, not vulnerable. |
| 2026-05-21 | `9fc6427` — MP write attribution resolves `User_ID` from the session. Loads the audit-forgery impact; field still not writable. |
| 2026-07-09 | `720f39d` — lockfile security sweep, better-auth 1.6.11 → 1.6.23. The 1.6 `input` semantics are now noticed. |
| 2026-07-09 | `c9d80d4` — `userGuid` flipped to `input: true` to repair sign-in. Correct diagnosis, but the endpoint that the flag had been implicitly guarding since February was left open. **Vulnerability introduced.** |
| 2026-09-12 | Reported privately by a downstream maintainer. |
| 2026-09-12 | `436466d` — endpoint closed; regression tests added. **Fixed.** |
| 2026-09-28 | Erratum: post-patch exposure is up to 7 days, not one hour; secret rotation made mandatory. See [Erratum](#erratum-2026-09-28). |

Exposure window: **2026-07-09 → 2026-09-12** (65 days), across Better Auth
1.6.23, 1.7.1 and 1.7.2. (The tree moved to 1.7.4 in `e02eec3`, *after* the fix.)

## Root cause

Better Auth 1.6 collapsed two previously separable concerns onto one flag. Before
1.6, `input: false` blocked user-supplied writes while `mapProfileToUser` still
populated the field. After 1.6, no value of `input` is both sign-in-correct and
endpoint-safe.

`c9d80d4` was forced to choose the sign-in-correct value, and the safety property
`input: false` had been quietly providing since February then had nowhere to
live. It needed to be re-established one layer up, at the endpoint — and was not.
The lesson generalizes: when an upstream change removes a setting's second
meaning, the protection it was silently providing has to be re-homed, not
assumed.

## Credit

Reported privately and responsibly by a downstream MPNext maintainer, who
identified the flaw in their own fork, diagnosed the mechanism correctly —
including that `input: false` is *not* the remedy — and checked upstream before
disclosing. Their report also recommended asserting both halves in tests, which
this fix does.
