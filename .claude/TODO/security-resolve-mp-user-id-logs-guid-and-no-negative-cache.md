# TODO: `resolveMpUserId` logs the raw User_GUID and re-queries MP on every failure

**Created:** 2026-09-28
**Severity:** Low — PII-adjacent identifier in logs (contrary to the file's own rule) plus request amplification against MP during an outage.
**Confidence:** Confirmed by repro.
**Source:** Auth security review 2026-09-28 (session, MP-client, authorization and OAuth reviewers — all four flagged it).

## Finding

`src/lib/auth.ts:69-94`:

- The failure path logs `console.error("[customSession] resolveMpUserId failed", { userGuid, err })` (`:88-91`). The same file's logging precedent says "never token contents and never the GUIDs themselves" (`:263-279`, `auth.userinfo.invalid_sub`), and CLAUDE.md rule 12 says log identifiers, not identity values.
- Only successes are cached. `customSession` runs on **every** `/get-session` (including `useSession()` window-focus refetches — `node_modules/better-auth/dist/plugins/custom-session/index.mjs:46-65`), so while MP is failing — or for a user with no `dp_Users` row — each call costs one MP query and one log line. Repro: 5 calls → 5 MP queries, 5 logs containing the GUID.
- The fetch has no timeout (see [security-mp-fetch-timeouts-and-redirects.md](security-mp-fetch-timeouts-and-redirects.md)), so a slow MP stalls every `getSession()` for uncached users.

## Fix

- Log a structured event with no GUID: `{ event: "auth.session.user_id_unresolved", reason, errName }` (or `hasUserGuid: true`).
- Negative-cache failures for 30–60 s (and "no such user" for longer).
- Optional: bound `userIdCache` (LRU) — growth is bounded by distinct signed-in users, so this is hygiene only.

## How to verify a fix

- Test: `console.error` arguments never contain the GUID (the existing test at `src/auth.test.ts:260-274` only asserts `toHaveBeenCalled()`).
- Test: at most one MP call inside the negative-cache window.
