import type { NextConfig } from "next";
// Relative, not the `@/` alias: this file is compiled by Next's own config
// loader, which does not read the tsconfig path mapping.
import { buildStaticSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  /**
   * Don't announce the framework (`X-Powered-By: Next.js`) on every response.
   */
  poweredByHeader: false,

  /**
   * `next dev` logs every Server Function call WITH its arguments by default.
   * Here that means pastoral notes (`updateContactLog`) and search terms
   * (emails, phone numbers from `searchContacts`) printed to the terminal —
   * and dev servers point at the shared production MP. This is outside `src/`,
   * so the `no-console` lint rule cannot catch it.
   */
  logging: {
    serverFunctions: false,
  },

  /**
   * Turns off the `/_next/image` optimizer endpoint (it 404s). Every
   * `next/image` in the app already passes `unoptimized` — contact photos load
   * straight from MP — so nothing uses it, and it is attack surface that has
   * had its own advisories.
   */
  images: {
    unoptimized: true,
  },

  /**
   * Request-independent security headers (F9).
   *
   * Applied here rather than in `src/proxy.ts` so they reach EVERY response —
   * `/api/*` and the `_next/static`, `_next/image`, `favicon.ico` and `assets/`
   * paths that the proxy matcher deliberately excludes.
   *
   * The Content-Security-Policy is NOT here. It carries a per-request nonce, so
   * it is built in `src/proxy.ts`; a value fixed at build time could not.
   * See `src/lib/security-headers.ts` for why the two halves are split.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildStaticSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
