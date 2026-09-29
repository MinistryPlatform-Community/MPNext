# TODO: Security-header hardening gaps (grouped)

**Created:** 2026-09-28
**Severity:** Info — defence in depth; the core header set (nonce CSP enforced by default, `strict-dynamic`, `frame-ancestors 'none'`, HSTS, nosniff, Referrer-Policy) is sound.
**Source:** Auth security review 2026-09-28 (client/config and HTTP-boundary reviewers).
**Related:** [security-csp-origin-of-validation.md](security-csp-origin-of-validation.md), [security-prerendered-nonceless-pages.md](security-prerendered-nonceless-pages.md)

## Items

- [ ] **No CSP reporting.** No `report-to` / `report-uri`, so violations in production are invisible. Add a reporting endpoint (mind that reports contain page URLs — keep query strings out, or use a same-origin collector that strips them).
- [ ] **No `Cross-Origin-Opener-Policy`.** `same-origin` is safe here (OAuth uses full-page redirects, no popups).
- [ ] **No `Cross-Origin-Resource-Policy`.** `same-origin` for app responses.
- [ ] **`X-Powered-By: Next.js` is sent.** Set `poweredByHeader: false` in `next.config.ts` (`next/dist/server/config-shared.js:114`).
- [ ] **`base-uri` could be `'none'`.**
- [ ] **Auth responses lack `Cache-Control: no-store` in some paths.** customSession drops the inner `no-store` on a null session (`node_modules/better-auth/dist/plugins/custom-session/index.mjs:49`); the callback 302 that sets session cookies and `/sign-in/social` responses carry none; `next.config.ts` adds none. Low risk (302s aren't heuristically cacheable, POSTs aren't cached, authenticated get-session is `no-store`), but have the route wrapper in `src/app/api/auth/[...all]/route.ts` set `Cache-Control: no-store` on every response.
- [ ] **`style-src 'unsafe-inline'` justification is disputable.** `security-headers.ts:184-212` and `security-headers.md:75-91` say a nonce can't cover the `<style>` react-remove-scroll injects at runtime. It can: `react-style-singleton` reads the nonce from `get-nonce`'s `setNonce()` (`node_modules/react-style-singleton/dist/es2015/singleton.js:1-9`). A tighter policy is `style-src 'self' 'nonce-…'` + `style-src-attr 'unsafe-inline'`, with `setNonce` called on the client. Gain is small (`img-src`/`font-src` already block CSS exfiltration). Also: `docs/security/downstream-hardening-playbook.md:625` calls `'unsafe-inline'` a dev relaxation — it's set in production too.

## How to verify

- Extend `src/lib/security-headers.test.ts` / `src/lib/next-config-headers.test.ts` for each header added.
