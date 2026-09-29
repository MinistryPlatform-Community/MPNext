# Security Headers Reference

Addresses **F9** of the 2026-09-12 auth review ("No HTTP security headers"). The
app shipped with an empty `next.config.ts`: no CSP, no anti-framing header, no
HSTS, no `Referrer-Policy`.

## Where each header lives, and why

| | `next.config.ts` | `src/proxy.ts` |
|---|---|---|
| **What** | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, HSTS (production build only) | `Content-Security-Policy` |
| **Why there** | request-independent, so a build-time config can express it | carries a per-request nonce, which a build-time value cannot |
| **Reaches** | every response, `/api` and static assets included | only paths the proxy matcher covers |

Both read their values from `src/lib/security-headers.ts`. `next.config.ts`
imports it by **relative** path (`./src/lib/security-headers`), not the `@/`
alias — Next compiles the config with its own loader, which does not read the
tsconfig path mapping.

Anti-framing is expressed twice on purpose: `X-Frame-Options: DENY` in the
config reaches the routes the proxy skips, `frame-ancestors 'none'` in the CSP
is the modern equivalent for the rest. They are *not* both CSP headers — two
`Content-Security-Policy` headers on one response are enforced as an
intersection, which is a miserable thing to debug.

`next.config.ts` also sets `poweredByHeader: false` (no `X-Powered-By`) and
`images.unoptimized: true`, which turns the `/_next/image` optimizer endpoint
off (it 404s; every `next/image` here is `unoptimized` anyway). The
`/api/auth` route handler adds `Cache-Control: no-store` to every response it
returns (session JSON, redirects carrying state cookies, its own 404s), since
better-auth sets it on only some of them.

## The CSP enforces

`src/proxy.ts` sends `Content-Security-Policy`. `CSP_ENFORCE=false` — and only
that exact string — drops back to `Content-Security-Policy-Report-Only`.
Anything else, unset included, enforces, so a typo fails loud (too strict)
rather than silent (no policy).

It shipped report-only first and was flipped on 2026-09-12 after the policy was
walked through a real browser against a **production build**, clean:

- sign-in (the redirect out to MP and back), and sign-out to MP's endsession
- contact photos on the header avatar, search results, and the detail page
- every Radix surface: dropdown, dialog, the select inside the dialog
- contact search and the contact-log dialog

**Report-only is not a substitute for that walk.** In the report-only pass the
console was completely clean; enforcing the same policy immediately blocked a
runtime-injected `<style>` and broke the contact-log dialog with React error
#441 (see `style-src` below). If you change the policy, re-walk it enforced,
against a production build — `next dev` has deliberate relaxations
(`'unsafe-eval'`, `ws:`) that hide violations.

## The policy, directive by directive

| Directive | Value | Note |
|---|---|---|
| `default-src` | `'self'` | |
| `script-src` | `'self' 'nonce-…' 'strict-dynamic'` (+ `'unsafe-eval'` in dev) | `strict-dynamic` makes CSP3 browsers ignore the allow-list and trust whatever the nonced bootstrap loads, so Next's chunks work without naming each one; `'self'` is the fallback for browsers that ignore `strict-dynamic`. |
| `style-src` | `'self' 'unsafe-inline'` | Deliberate, in dev *and* production — see below. |
| `img-src` | `'self' data: blob:` + MP file origin | `data:`/`blob:` are `next/image`'s placeholder and preview machinery. |
| `font-src` | `'self'` | `next/font` self-hosts Geist under `/_next/static`; there is no Google Fonts origin to allow. |
| `connect-src` | `'self'` (+ `ws:` in dev) | Every MP call is server-side; the browser only ever talks to this origin. `ws:` is HMR. |
| `object-src` | `'none'` | |
| `frame-src` | `'none'` | |
| `base-uri` | `'none'` | Stops an injected `<base>` re-pointing every relative URL on the page. Neither the app nor Next renders a `<base>`, so none is allowed. |
| `form-action` | `'self'` + MP OAuth origin | See below. |
| `frame-ancestors` | `'none'` | |
| `upgrade-insecure-requests` | present | Production only, **and** omitted whenever the policy is report-only — browsers refuse to honor it there and log an error on every page, burying the reports report-only exists to surface. |

The two origins come from `NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL` (`img-src`)
and `MINISTRY_PLATFORM_BASE_URL` (`form-action`), reduced with `originOf()`,
which returns `null` rather than throwing for a missing or malformed value,
a non-http(s) scheme, or a hostname that is not plain `[a-z0-9.-]` (so
`https://*` or `https://a;sandbox` cannot widen or inject into the policy) —
the directive narrows, the request path never 500s.

There is no `style-src-attr` (dropped as redundant) and no `report-uri`/
`report-to`: violations surface in the browser console only. **Known gap,
decided 2026-09-29:** there is no CSP reporting endpoint, so a violation in a
user's browser is never seen by the operators. A fork that wants it adds
`report-to` and a collector of its own.

## Deliberate loosenings — do not "tighten" these

- **`style-src 'self' 'unsafe-inline'`, with NO nonce** — Radix's dialog pulls
  in react-remove-scroll, which locks body scroll by **injecting a `<style>`
  element at runtime**, un-nonced as shipped. A hash cannot cover it (the
  content embeds the computed scrollbar width, so it varies by platform and
  zoom — two different hashes appeared in one page view). A nonce *could*:
  react-style-singleton stamps whatever `get-nonce`'s `setNonce()` was given
  onto that `<style>`, so `setNonce(nonce)` on the client plus
  `style-src-attr 'unsafe-inline'` for Radix's style attributes would work.
  **Accepted 2026-09-29, kept for simplicity:** inline style cannot run
  script, and the usual CSS exfiltration channel (selector-triggered `url()`
  loads) is already shut by `img-src` and `font-src`, which allow no attacker
  origin.

  The nonce must stay OUT of this directive: CSP3 browsers ignore
  `'unsafe-inline'` whenever a nonce is present in the same directive, which
  silently re-blocks every runtime-injected style. `style-src-attr` is gone as
  redundant — `style-src` covers attributes and elements alike.

  This replaced an earlier `style-src 'self' 'nonce-…'` + `style-src-attr
  'unsafe-inline'` design that looked right and was wrong. Report-only mode did
  **not** surface it; only enforcing the policy in a real browser did, where
  the dialog broke with React error #441. That is the argument for doing the
  enforced walk rather than trusting a clean report-only run.
- **`form-action 'self' <MP origin>`** — sign-out is a `<form action={…}>`
  server action that ends in `redirect()` to MP's `/oauth/connect/endsession`.
  Browsers apply `form-action` to the whole redirect chain a form submission
  produces, not just its first hop, so `'self'` alone can abort sign-out.
- **`img-src` includes the MP file origin** — contact photos are `next/image`
  with `unoptimized`, so the browser fetches them straight from Ministry
  Platform. Without the origin from
  `NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL`, every avatar breaks.

The dev-only relaxations are exactly two — `'unsafe-eval'` in `script-src` and
`ws:` in `connect-src` — both gated on `NODE_ENV === 'development'`, so neither
reaches a production build. `'unsafe-inline'` in `style-src` is **not** one of
them: it is identical in dev and in production, and a test pins that. The only
other environment difference is `upgrade-insecure-requests` — present in
production, absent in dev, and absent in report-only mode whatever the
environment. Everything else is byte-identical across all four combinations.

## Nonces force dynamic rendering

Next.js stamps the nonce onto its own script tags **while rendering a request**,
reading it back off the incoming `Content-Security-Policy` (or `-Report-Only`)
header that the proxy sets on `NextResponse.next({ request: { headers } })`. A
page prerendered at build time has no request, so no nonce, so under
enforcement its bootstrap script is blocked and the page never hydrates.

The proxy also sets the raw nonce as an `x-nonce` request header (the
convention from Next's CSP guide). Nothing in `src/` reads it today — Next takes
the nonce from the CSP header, not from `x-nonce` — so it is only there for a
server component that needs to nonce its own `<script>` (read it with
`(await headers()).get('x-nonce')`). It is a request header only; it never
appears on the response.

Two consequences:

1. **Route segment config is ignored in a `"use client"` module.** This is why
   `/signin`'s body lives in `src/components/sign-in/` and `src/app/signin/
   page.tsx` is a thin server component holding `export const dynamic =
   "force-dynamic"`. The export was silently inert while it sat in the client
   file — the build output still read `○ /signin`. `src/app/signin/
   page.test.tsx` pins both facts.
2. **Check the build output after adding a route.** Anything printed with `○`
   is prerendered and will not hydrate under an enforced CSP. Every app route
   is `ƒ` (`/signin`, `/session-error` and `/signed-out` each export
   `dynamic = "force-dynamic"`; the rest are dynamic because they await
   `searchParams` or, under `(web)`, `headers()` via `AuthWrapper`) except Next's
   two built-ins, which are always `○` and cannot opt out: `/_not-found`
   (renders its HTML but will not hydrate under enforcement; no interactivity
   to lose, so accepted) and `/_global-error`, the 500 page wrapping
   `src/app/global-error.tsx` — which is why that file recovers through a
   plain link rather than a JS handler. CI enforces this: the `build` job runs
   `scripts/check-prerender.mjs` (`npm run build:check-prerender`), which
   fails if `.next/prerender-manifest.json` lists any route outside that
   two-entry allowlist.

## Tests

- `src/lib/security-headers.test.ts` — every directive and both sides of every
  branch (dev/prod, origin present/absent, enforce/report), plus two guards
  that encode the traps above: a nonce must never appear in `style-src`, and
  the report-only policy must be identical to the enforced one apart from
  `upgrade-insecure-requests`.
- `src/lib/next-config-headers.test.ts` — the config actually attaches the
  static headers to `/(.*)`, and does *not* set a second CSP.
- `src/proxy.test.ts` § Content-Security-Policy — the header on every return
  path including redirects, the nonce forwarded on the request headers and
  matching the response policy, a fresh nonce per request, and the
  `CSP_ENFORCE` switch.
- `src/app/signin/page.test.tsx` § rendering mode, and the matching tests in
  `src/app/session-error/page.test.tsx` and `src/app/signed-out/page.test.tsx`
  — the prerendering opt-outs.
- `scripts/check-prerender.test.ts` — the CI prerender guard's allowlist is
  exactly `/_not-found` and `/_global-error`, and any other static route fails.
