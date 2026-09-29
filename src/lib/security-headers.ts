/**
 * HTTP security headers (F9).
 *
 * The app shipped with an empty `next.config.ts`: no Content-Security-Policy,
 * no anti-framing header, no HSTS, no Referrer-Policy. The session cookie is
 * the only credential this app has, and every page renders strings that came
 * out of Ministry Platform, so a script injection anywhere is an immediate
 * session-theft path. These headers are the defense-in-depth layer under the
 * authorization work in F1/F2/F7.
 *
 * The split between the two halves of this file is dictated by what each
 * header needs to know about the request:
 *
 * - `buildStaticSecurityHeaders()` is request-independent, so it is applied by
 *   `next.config.ts` via `headers()`. That covers EVERY response, including
 *   `/api/*` and the static assets that `src/proxy.ts`'s matcher deliberately
 *   skips.
 * - `buildContentSecurityPolicy()` needs a per-request nonce, so it can only be
 *   applied from `src/proxy.ts`. A nonce must never be reused across responses;
 *   a value baked into the build config would be a constant and therefore
 *   worthless.
 *
 * That split is also why anti-framing is expressed twice, as `X-Frame-Options`
 * here and as `frame-ancestors` in the CSP. They are not redundant: the CSP
 * only reaches routes the proxy matcher covers, while `X-Frame-Options` reaches
 * everything. Two separate headers, rather than a second `Content-Security-
 * Policy` header in the config — two CSP headers on one response are enforced
 * as an intersection, which is a confusing thing to leave for the next reader.
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Response headers that do not depend on the request. Applied to `/(.*)` from
 * `next.config.ts`.
 *
 * @param isProduction - Gates HSTS. Defaults to the ambient `NODE_ENV`, and is
 *   a parameter so the test suite can assert both halves of the branch without
 *   mutating the environment.
 */
export function buildStaticSecurityHeaders(
  isProduction: boolean = process.env.NODE_ENV === 'production'
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    // Anti-framing for every route, including the ones the proxy matcher skips.
    // `DENY` rather than `SAMEORIGIN`: nothing in this app frames itself.
    { key: 'X-Frame-Options', value: 'DENY' },

    // Stop content-type sniffing on everything this app serves. (It does not
    // reach MP contact photos: those load straight from MP's file server, so
    // their headers are MP's, not ours.)
    { key: 'X-Content-Type-Options', value: 'nosniff' },

    // Send the full URL only to ourselves. Cross-origin navigations — notably
    // the sign-out hop to MP's endsession endpoint — leak the origin and
    // nothing else, so a contact GUID in the path never reaches a third party.
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

    // This app asks for none of these. Denying them outright means an injected
    // script cannot ask on our behalf either.
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },

    // Put this app's windows in their own browsing-context group, so a page
    // that opens or is opened by it cannot keep a `window.opener` handle
    // across origins. Safe here: sign-in and sign-out are full-page
    // redirects, never popups.
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },

    // No other origin may embed this app's responses (scripts, JSON, images)
    // as subresources. Nothing cross-origin loads from this app; the browser
    // loads MP photos FROM MP, which this header does not touch.
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  ];

  // HSTS is gated on a PRODUCTION BUILD (`NODE_ENV === 'production'`, which
  // `next build` bakes into routes-manifest.json), not on where it runs — so
  // `next start` locally does send it. Browsers ignore HSTS over plain http,
  // so a local http `next start` is unaffected; over https (e.g. a local TLS
  // proxy) it WILL pin that host to https for two years. `next dev` never
  // sends it.
  //
  // Two years, subdomains included. No `preload`: that is a one-way submission
  // to a browser-vendor list and is the deploying church's call, not this
  // repo's default.
  if (isProduction) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains',
    });
  }

  return headers;
}

/**
 * A hostname that is safe to paste into a CSP source list: ASCII letters,
 * digits, dots and hyphens only (the WHATWG URL parser has already
 * lower-cased it and converted any IDN to punycode). Rules out `*` — which in
 * a CSP source means "any host" — and `;`/space, which would end the source or
 * the directive.
 */
const CSP_SAFE_HOSTNAME = /^[a-z0-9.-]+$/;

/**
 * Parses an origin out of a configured URL, for use as a CSP source.
 *
 * Returns null rather than throwing for anything unusable. This is called on
 * the request path in `src/proxy.ts`, where a malformed or missing environment
 * variable must degrade to a tighter policy — never take the whole app down.
 *
 * "Unusable" includes values that parse as URLs but would WIDEN or break the
 * policy: a non-http(s) scheme (`javascript:` has the origin `"null"`), or a
 * hostname outside `CSP_SAFE_HOSTNAME` — `https://*` (or `https://%2A`, which
 * the parser decodes to `*`) would allow every https host, and
 * `https://a;sandbox` would inject a directive. The port needs no check: the
 * URL parser accepts only digits there.
 */
export function originOf(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!CSP_SAFE_HOSTNAME.test(url.hostname)) return null;
  return url.origin;
}

/**
 * Generates a fresh CSP nonce.
 *
 * 16 random bytes, base64. `crypto.getRandomValues` + `btoa` rather than the
 * `Buffer.from(crypto.randomUUID())` form in Next's own CSP guide: a UUID is
 * 122 bits of entropy wrapped in 36 bytes of hex and dashes, and `Buffer` is
 * Node-only. This is shorter, has more entropy per character, and keeps working
 * if the proxy ever runs somewhere without `Buffer`.
 */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export interface CspOptions {
  /** Per-request nonce. Next.js reads this back off the request header and
   *  stamps it onto the framework's own script and style tags. */
  nonce: string;
  /** Loosens the policy for the dev server's tooling. */
  isDev?: boolean;
  /**
   * Origin of the Ministry Platform file server, for contact photos. These are
   * `next/image` with `unoptimized`, so the BROWSER fetches them straight from
   * MP — they never pass through this app's image optimizer, and without this
   * origin in `img-src` every avatar breaks.
   */
  imageOrigin?: string | null;
  /**
   * Whether this policy will be sent as `Content-Security-Policy-Report-Only`.
   *
   * Only affects `upgrade-insecure-requests`, which browsers refuse to honor in
   * a report-only policy and complain about in the console on every page:
   * "The Content Security Policy directive 'upgrade-insecure-requests' is
   * ignored when delivered in a report-only policy." Emitting it there buys
   * nothing and trains people to ignore the console, which is the one place
   * report-only mode does its work.
   */
  reportOnly?: boolean;
  /**
   * Origin of the Ministry Platform OAuth server, for `form-action`.
   *
   * Sign-out is a `<form action={handleSignOut}>` server action that ends in
   * `redirect()` to MP's `/oauth/connect/endsession`. Browsers apply
   * `form-action` to the whole redirect chain a form submission produces, not
   * just its first hop, so `'self'` alone can abort sign-out at the redirect.
   */
  formActionOrigin?: string | null;
}

/**
 * Builds the Content-Security-Policy value for one request.
 *
 * Applied from `src/proxy.ts`, which also sets the same value on the REQUEST
 * headers — that is how Next.js discovers the nonce (see
 * `node_modules/next/dist/server/app-render/app-render.js`, which reads either
 * `content-security-policy` or `content-security-policy-report-only`).
 */
export function buildContentSecurityPolicy({
  nonce,
  isDev = false,
  reportOnly = false,
  imageOrigin = null,
  formActionOrigin = null,
}: CspOptions): string {
  const directives: string[] = [
    "default-src 'self'",

    // `strict-dynamic` means the allow-list in this directive is ignored by
    // browsers that understand it: trust flows from the nonced framework
    // bootstrap to whatever it loads, so Next's chunk loading keeps working
    // without naming every chunk. `'self'` stays for older browsers that
    // ignore `strict-dynamic` instead.
    //
    // `'unsafe-eval'` in dev only: React uses `eval` there to rebuild
    // server-side error stacks in the browser. Neither React nor Next uses it
    // in a production build.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,

    // Deliberate loosening, do not "tighten" this back to a nonce.
    //
    // This directive originally read `style-src 'self' 'nonce-...'` plus a
    // separate `style-src-attr 'unsafe-inline'`, on the theory that a nonce
    // could cover real stylesheets while the attr directive covered Radix's
    // inline `style` attributes. Enforcing the policy in a browser disproved
    // it (2026-09-12): Radix's dialog pulls in react-remove-scroll, which locks
    // body scroll by INJECTING A <style> ELEMENT at runtime. That is an
    // element, not an attribute, so `style-src-attr` does not apply and it
    // falls through to `style-src` — where a nonce cannot help, because the
    // element is created by script long after the server chose the nonce.
    // Under enforcement the browser blocked it and the dialog broke with
    // React error #441.
    //
    // A hash is not a workable alternative: the blocked content includes the
    // computed scrollbar width, so it varies by platform and zoom level. Two
    // different hashes showed up in a single page view.
    //
    // `'unsafe-inline'` is therefore the honest answer, and it must appear
    // WITHOUT a nonce — a nonce in the same directive makes CSP3 browsers
    // ignore `'unsafe-inline'` entirely, which is the trap that produced the
    // broken policy above. `style-src-attr` is gone as redundant: this covers
    // attributes and elements alike.
    //
    // The security cost is real but small: inline STYLE injection can do
    // limited data exfiltration via selectors, but not script execution. The
    // control that matters, `script-src` with a nonce and `strict-dynamic`,
    // is untouched.
    "style-src 'self' 'unsafe-inline'",

    // `data:` and `blob:` are next/image's placeholder and preview machinery.
    `img-src 'self' data: blob:${imageOrigin ? ` ${imageOrigin}` : ''}`,

    // `next/font` self-hosts Geist under /_next/static at build time, so there
    // is no Google Fonts origin to allow here.
    "font-src 'self'",

    // Every MP call is server-side; the browser only ever talks to this origin.
    // `ws:` is the dev server's HMR socket.
    `connect-src 'self'${isDev ? ' ws:' : ''}`,

    "object-src 'none'",
    "frame-src 'none'",

    // Stops an injected <base> from re-pointing every relative URL on the page.
    // `'none'` rather than `'self'`: neither this app nor Next renders a
    // <base> element, so there is no legitimate one to allow.
    "base-uri 'none'",

    `form-action 'self'${formActionOrigin ? ` ${formActionOrigin}` : ''}`,

    // The CSP-level anti-framing control; `X-Frame-Options` above covers the
    // routes the proxy does not run on.
    "frame-ancestors 'none'",
  ];

  // Production only: the directive rewrites http subresource URLs to https,
  // which is exactly wrong against a local http dev server. Also omitted in
  // report-only mode, where browsers ignore it and log an error saying so on
  // every page — noise that buries the real violation reports.
  if (!isDev && !reportOnly) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * Which CSP header name to send.
 *
 * ENFORCES by default. `CSP_ENFORCE=false` drops back to report-only as an
 * escape hatch, and only that exact string does — any other value, including
 * unset or a typo, enforces.
 *
 * This shipped report-only first, deliberately: a nonce-based CSP is the one
 * security header that can white-screen an app, so the policy was trialled in
 * a browser before it was allowed to block anything. That trial happened
 * 2026-09-12 against a production build — sign-in, contact search with MP
 * photos, contact detail, the Radix dialog, the Select inside it, the user
 * menu and sign-out to MP — and it earned its keep: enforcement caught a
 * blocked runtime-injected `<style>` that report-only had NOT reported (see
 * the style-src comment above). Once that was fixed, the enforced walk came
 * back clean, so the default flipped.
 *
 * The escape hatch is deliberately inverted from the old default. Report-only
 * is now the unusual state — something you turn on to diagnose a violation,
 * not the state a deploy drifts into by forgetting a variable.
 */
export function cspHeaderName(
  enforce: boolean = process.env.CSP_ENFORCE !== 'false'
): 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only' {
  return enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
}
