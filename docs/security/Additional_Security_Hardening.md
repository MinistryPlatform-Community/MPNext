# Additional Security Hardening

**Created:** 2026-09-28
**Source:** Auth security review 2026-09-28. The Medium findings below were partly
fixed on 2026-09-28. What is left for each one needs a decision (new infrastructure
or a change of policy), so it is tracked here rather than as open TODOs.
**Updated 2026-09-29:** §1 accepted as is; §3's name-matching remainder deferred.

| # | Area | Shipped 2026-09-28 | Remaining | Decision |
|---|---|---|---|---|
| 1 | Sign-out revocation | 12 h session cap, `refreshCache: false`; `/signed-out` page (2026-09-29) | A copied cookie still works for up to 1 h after sign-out | **Accepted 2026-09-29** — no session store |
| 2 | MP login re-validation | 12 h absolute cap, 15 min `userIdCache` TTL | Deleting or disabling an MP login doesn't end the app session | Needed: fail closed on a confirmed-missing login? |
| 3 | Role granularity | Blank `MP_SECURITY_ROLES` fails closed; `*` = any role | No read/write split; MP table and record rights not consulted; roles matched by name | Needed: separate role lists, or defer to MP's rights. Name matching **deferred 2026-09-29** |

---

## 1. Sign-out cannot revoke a copied session cookie

**Severity now:** Low (was Medium). The exposure is bounded but not closed.
**Status:** Accepted 2026-09-29 — see [Decision](#decision-2026-09-29) below.

### Shipped

Stateless mitigation in `src/lib/auth.ts`:

- `session.expiresIn` is 12 h.
- `disableSessionRefresh: true`.
- `cookieCache.refreshCache: false`, set explicitly. In stateless mode better-auth
  quietly defaulted it to `true`, which let a copied cookie re-sign itself for about
  7 days.

`src/auth.session-lifetime.test.ts` walks a fake clock through the real `auth`
instance. It pins two things: no session outlives sign-in + 12 h, and a cookie pair
copied before sign-out (or sent to an instance without the in-memory row) dies within
1 h.

Emergency "sign everyone out" levers are in `.claude/references/auth.md`
§ Session lifetime and revocation: bump `cookieCache.version` and redeploy, or rotate
`BETTER_AUTH_SECRET`.

Added 2026-09-29: a public `/signed-out` page that never starts OAuth. `SessionGuard`
and the cross-tab sign-out broadcast send a tab whose session has ended there, instead
of to `/signin` — which auto-starts OAuth and, with the MP SSO session still alive,
could silently sign a shared device back in.

### Remaining

- **Replay after sign-out:** a copied `session_token` + `session_data` pair still
  validates for up to 1 h after the victim signs out.
- **Multiple instances:** if a different serverless instance or process handled
  the sign-out, the in-memory row survives there, and the pair validates up to
  the 12 h cap. (Within one process all Next bundle layers now share one `auth`
  instance — fixed 2026-09-29; before that, sign-out never reached the row
  `/get-session` reads, even on a single `next start`.)
- **Shared devices:** the session cookie is persistent (12 h `Max-Age`), so it
  survives closing the browser. Anyone using the same browser profile before the cap
  lapses is signed in, unless the previous user signed out.

### Decision (2026-09-29)

**Accepted as is.** The 12 h absolute cap, the 1 h replay bound after sign-out
(up to 12 h on an instance that never saw the sign-out) and the persistent 12 h cookie
are the accepted residual risk. No session store is planned. The option below stays
the route if that changes.

### Option

Add a server-side session store so that sign-out deletes the session everywhere:

- better-auth `secondaryStorage` (Redis, Upstash or Vercel Marketplace KV), or a
  database.
- With a store present, better-auth no longer defaults `refreshCache` on. Then drop
  `cookieCache.maxAge` to about 5 min.

A store would also make the OAuth `state` one-time use (`storeStateStrategy:
"database"`) and replace the unbounded in-process memory adapter.

### How to verify (if a store is added)

1. Sign in through the mock code flow, as in `src/auth.session-lifetime.test.ts`.
2. Sign out.
3. Replay the old cookies to `/get-session` and expect `null` immediately.

Removing the store must make the test fail.

---

## 2. A live session is not re-validated against the MP login (`dp_Users`)

**Severity now:** Low (was Medium). The exposure is bounded to 12 h, not closed.

### Shipped

- **Absolute lifetime:** `session.expiresIn` 12 h plus `disableSessionRefresh: true`.
  The in-memory path no longer slides `expiresAt` forward. The clock walk in
  `src/auth.session-lifetime.test.ts` pins this on both the cookie-cache and the
  in-memory-adapter paths.
- **User ID cache:** `userIdCache` has a 15 min TTL (`USER_ID_CACHE_TTL_MS`). A
  deleted `dp_Users` login therefore loses its `User_ID` attribution within 15 min
  (`src/auth.user-id-cache.test.ts`).
- **Incidental re-check on serverless:** with `refreshCache: false`, a request made
  after the 1 h cookie cache that lands on an instance without the in-memory row sends
  the user back through MP sign-in.

### Remaining

An MP admin who disables or deletes a compromised login, or resets its password, does
not end that user's app session before the 12 h cap, on a process that holds the
in-memory row. Only removing the user's roles (`dp_User_Roles`, re-read on every
request) takes effect immediately.

This was not done because it conflicts with the current design rule that a failed
`dp_Users` lookup never blocks session creation. `resolveMpUserId` returns
`userId: null` both when there is no row and when MP is unreachable.

### Options

- **Tell the two cases apart:** have `resolveMpUserId` distinguish "row definitely
  absent, or a disabled-login flag set" from "lookup failed", and have
  `customSession` return no session only in the first case. That fails open on
  outages and closed on a confirmed-gone login. Check first which `dp_Users` column
  marks a disabled login, with a read-only query.
- **Use MP's token refresh:** refresh the user's MP token when the cookie is
  re-minted, and fail the session if MP refuses the refresh.

**Decision needed:** whether a confirmed-missing login should end the session, which
changes the fail-open rule.

### How to verify

Two tests:

- The `dp_Users` lookup starts returning nothing: the next session read after the TTL
  returns `null`.
- An MP outage (the lookup throws): a session is still returned.

---

## 3. The role gate ignores table and operation, and MP's own per-role rights

**Severity now:** Low (was Medium) now that the default fails closed. The remaining
risk is an operator choosing a broad role list or `*`.

### Shipped

- **Fail-closed default:** if `MP_SECURITY_ROLES` is unset or blank, and there is no
  usable legacy `MP_WRITE_SECURITY_ROLES`, everyone is refused in every `NODE_ENV`
  (`reason: roles_not_configured`). A one-time `mp.authz.config` warning is logged.
- **Explicit "any role":** set `MP_SECURITY_ROLES=*`.
- **Separator-only values:** `","` fails closed as well.
- **Setup and docs:** `npm run setup` prompts for the value, and `setup:check` warns
  when it is blank. `.env.example`, the README, `.claude/references/auth.md`
  § Configuring the gate, and CLAUDE.md all document it.

### Remaining

In `src/services/authorizationService.ts` `hasSecurityRole`, `ctx.table` and
`ctx.operation` play no part once a user holds a permitted role. Every permitted role
gets read, create, update and delete on both `Contacts` and `Contact_Log`.

The gate also ignores two MP-side controls:

- MP's per-role table permissions (`vw_mp_User_Rights`).
- MP record-level security (`dp_Record_Security`). `Contact_Log` carries the
  SecureRecord flag, so records secured in MP are still returned to any permitted role.

Roles are matched by **name** (trimmed, case-insensitive), not by `Role_ID`. MP role
names are editable free text and not unique, so anyone who can create, rename or assign
MP Security Roles can satisfy the gate; and a role whose name contains a comma cannot be
listed in `MP_SECURITY_ROLES`. **Deferred 2026-09-29:** name matching stays for now.
Restrict who can edit Security Roles in MP. A future `MP_SECURITY_ROLE_IDS` would
close it.

### Options

- **Separate read and write role lists**, e.g. `MP_SECURITY_ROLES_READ` and
  `MP_SECURITY_ROLES_WRITE`.
- **Defer to MP's rights:** decide from `vw_mp_User_Rights`
  (`Item_DB_Reference = 'Contact_Log'` plus its access level). Verify the view's
  semantics first, with a **read-only** query and the user's confirmation, per
  CLAUDE.md.
- **Record-level security:** consider honouring `dp_Record_Security` for
  `Contact_Log` reads.

**Decision needed:** app-level role lists, or MP's own permission model.

### How to verify

A role that is permitted to read but not write `Contact_Log` can list logs, but is
refused create, update and delete.
