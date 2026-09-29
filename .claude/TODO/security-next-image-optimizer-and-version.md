# TODO: Disable the unused Next image optimizer, and bump `next` past 16.3.5

**Created:** 2026-09-28
**Severity:** Info — neither is exploitable in this configuration today.
**Confidence:** Image optimizer: confirmed by code reading. Advisory: per the GitHub advisory database as read by the reviewer — re-confirm with `npm audit` / the advisory page before acting.
**Source:** Auth security review 2026-09-28 (HTTP-boundary reviewer).

## Image optimizer

- `next.config.ts` has no `images` block, so `/_next/image` is live with `localPatterns: undefined` (`node_modules/next/dist/shared/lib/image-config.js`). Every `next/image` in the app is `unoptimized`, so nothing needs it.
- Checked safe: its internal fetch carries no cookies (`image-optimizer.js:1038-1043`); `remotePatterns` is empty so absolute URLs are refused (`:571-615`) — no SSRF, no session leak.
- Still attack surface: this endpoint had several 2026 advisories (an AVIF RCE and two DoS bugs, fixed ≤ 16.3.3).
- **Fix:** `images: { unoptimized: true }` in `next.config.ts`.

## `next@16.3.5`

- Reported in range of **GHSA-vcvr-r3jv-pc5j / CVE-2026-94545** (RCE in `next/og` `ImageResponse`, fixed in 16.3.6). Not exploitable here — nothing imports `next/og` (grep).
- **Fix:** bump to ≥ 16.3.6 via the normal dependency path (`npm run deps:relock`, then `npm run deps:verify` — see CLAUDE.md § Dependency Rule). Run the `audit-deps` command for a full triage.

## Related dependency note (no action needed, but worth pinning)

- This app matches the preconditions of better-auth **GHSA-wxw3-q3m9-c3jr** (forged OAuth state with cookie state storage) exactly — `storeStateStrategy: "cookie"` (`src/lib/auth.ts:313`) + `pkce: false` (`:361`). It is fixed in better-auth ≥ 1.6.2 (binding present at `node_modules/better-auth/dist/state.mjs:113`). Keep `better-auth` ≥ 1.6.2 and add a test that fails if that binding regresses — PKCE, which would remove the dependency, is not available because MP does not support it, so this upstream fix is the only protection.

## How to verify a fix

- `GET /_next/image?url=/assets/x.png&w=64&q=75` → 404/400 after the change.
- `npm ls next` ≥ 16.3.6; `npm run deps:verify` clean.
