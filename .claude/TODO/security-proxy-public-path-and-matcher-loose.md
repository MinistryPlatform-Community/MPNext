# TODO: `proxy.ts` public-path check and matcher are looser than intended/documented

**Created:** 2026-09-28
**Severity:** Low / Info — latent: no current route is exposed, because pages and actions gate themselves.
**Confidence:** Confirmed by repro using the real `proxy` and Next's own `getMiddlewareMatchers`.
**Source:** Auth security review 2026-09-28 (HTTP-boundary reviewer).
**Related:** [security-layout-gate-docs-and-test-misleading.md](security-layout-gate-docs-and-test-misleading.md), [security-header-hardening-gaps.md](security-header-hardening-gaps.md)

## Finding

- `src/proxy.ts:56` — `pathname.startsWith('/api')` also makes `/apifoo`, `/api-docs`, `/api` public. A future page at e.g. `/apidocs` would skip the cookie redirect.
- `src/proxy.ts:80` — matcher `'/((?!_next/static|_next/image|favicon.ico|assets/).*)'`: the `.` in `favicon.ico` is unescaped and the exclusions are prefixes. `/faviconXico`, `/favicon.ico/x`, `/_next/imagefoo`, `/_next/staticX` skip the proxy entirely — **no cookie redirect and no CSP header**.
- The proxy checks only cookie **presence**: `better-auth.session_token=garbage` passes to `/contactlookup`, `/session-error`, `/no-access`. That's fine as an optimistic check (AuthWrapper and actions re-validate), but `.claude/references/auth.md:557` says "Everything else requires a **valid** session cookie", and `:572` lists `/session-error` as needing a session.
- `src/components/contact-lookup/actions.ts:8-9` reasons that the proxy "lets all /api paths through" — server actions are POSTs to *page* paths; they get past the proxy with any cookie value. (Conclusion — the action's own gate is the only real control — is still right.)
- 404s on matcher-excluded paths (`/assets/<missing>`, `/faviconXico`) are served with no CSP at all.

## Fix

- Public check: `pathname === '/api' || pathname.startsWith('/api/')`.
- Matcher: escape and anchor, e.g. `'/((?!_next/static/|_next/image(?:$|/)|favicon\\.ico$|assets/).*)'`.
- Correct `auth.md:557, 572` and the `contact-lookup/actions.ts:8-9` comment.

## How to verify a fix

- A test that compiles `config.matcher` with `next/dist/build/analysis/get-page-static-info` `getMiddlewareMatchers` and asserts a table of paths (the current `proxy.test.ts:296-302` only uses `toContain`, so adding `|contactlookup` to the exclusions would pass).
- Test `/apifoo` → redirect to `/signin` without a cookie.
