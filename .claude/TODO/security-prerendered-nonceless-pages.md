# TODO: Prerendered, nonce-less error pages — `/_global-error` joins the known `/_not-found`

**Created:** 2026-09-28 (`/_not-found` was already accepted as known-open; `/_global-error` and the matcher-excluded 404 are new)
**Severity:** Info — the pages are static; the main impact is that the global-error "Try again" button can't hydrate under the enforced CSP.
**Confidence:** Confirmed from `.next/prerender-manifest.json` and the built HTML.
**Source:** Auth security review 2026-09-28 (client/config and HTTP-boundary reviewers).
**Related:** [security-ci-missing-lint-and-build.md](security-ci-missing-lint-and-build.md), [security-proxy-public-path-and-matcher-loose.md](security-proxy-public-path-and-matcher-loose.md)

## Finding

- `.next/prerender-manifest.json` lists `/_global-error` as static; `.next/server/pages/500.html` contains 0 nonces. Under the enforced CSP, the static 500 page won't hydrate, so its "Try again" button does nothing.
- `.claude/references/security-headers.md:125-132` says only `/_not-found` is static.
- 404s on matcher-excluded paths (`/assets/<missing>`, `/faviconXico`) are served with **no CSP header at all** because the proxy doesn't run there.

## Fix

- Force dynamic rendering for the global error boundary if Next allows it (e.g. read `headers()`), or make the page work without JS (a plain `<a href="/">` instead of a `reset()` button).
- Update `security-headers.md` to list every static route and why it's accepted.
- Fix the matcher (related item) so excluded-path 404s still get the CSP, or accept and document.

## How to verify a fix

- After `npm run build`, the only static app routes are the documented ones; the global-error page's recovery control works with the CSP enforced.
