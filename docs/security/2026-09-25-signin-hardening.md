# Security Note — Sign-in hardening (F3b, F12)

| | |
|---|---|
| **Issues** | **F3b**: open redirect on `/signin` via tab/CR/LF (bypass of the F3 fix) · **F12**: `/sign-in/social` accepted direct ID-token sign-in |
| **Severity** | F3b **Low–Medium** · F12 **Low** (Low–Medium if this app's MP OIDC client is shared with another app or allows implicit/hybrid) |
| **Affected** | F3b: any checkout containing [`ee46343`](https://github.com/MinistryPlatform-Community/MPNext/commit/ee46343) (the F3 fix) and **not** [`b7dc8e6`](https://github.com/MinistryPlatform-Community/MPNext/commit/b7dc8e6). F12: any checkout **not** containing [`cf5a824`](https://github.com/MinistryPlatform-Community/MPNext/commit/cf5a824), on **better-auth 1.7.x** with `discoveryUrl` set |
| **Fixed in** | [`b7dc8e6`](https://github.com/MinistryPlatform-Community/MPNext/commit/b7dc8e6) (F3b), [`cf5a824`](https://github.com/MinistryPlatform-Community/MPNext/commit/cf5a824) (F12) — both 2026-09-28 |
| **Reported** | 2026-09-25, privately, by Jonathon Huff (The Moody Church) |

Neither issue is known to have been exploited. Neither exposes data by itself.

## F3b: `callbackUrl` bypass

The F3 fix only refused a leading `//` or `/\`. Browsers strip tab, LF and CR
from a URL before parsing it, so `/signin?callbackUrl=/%09/example.com` passed
the check and sent an **already signed-in** user to `https://example.com/`.

- **Impact:** a phishing hop from a link on the app's own domain. No access to
  data.
- **Signed-out users:** already safe. better-auth's server-side callback check
  refused the value.

**Fix:** `sanitizeCallbackUrl` now mirrors better-auth's `isSafeRelativeURL`.

## F12: ID-token sign-in

With `discoveryUrl` set, better-auth 1.7 enables an ID-token mode on
`POST /sign-in/social`. That mode signs the caller in without the OAuth code
exchange, and it took the identity from a caller-supplied access token without
checking it against the ID token.

> **Update 2026-09-29 (issue #101):** current `main` no longer sets
> `discoveryUrl` (explicit endpoints; the id_token is verified in `getUserInfo`),
> so better-auth refuses this mode itself with `404 ID_TOKEN_NOT_SUPPORTED`. The
> F12 fix (`cf5a824`) is kept and still answers first. A fork that still sets
> `discoveryUrl` is affected exactly as described here.

**What exploiting it required:**

1. An ID token issued to this app's own OIDC client. MPNext exchanges codes
   server-to-server, so a normal user never sees one. It is realistic only if
   the client ID is shared with an app that exposes tokens to users.
2. **Another user's MP access token.** That is already a stolen credential.

**What it added:** the holder of a narrowly scoped stolen token could turn it
into an MPNext session as that user. That meant their security roles, reads
through the app's service account, and audit attribution on writes.

**Fix, three independent layers:**

- a `hooks.before` guard refusing `idToken` bodies (404
  `ID_TOKEN_SIGN_IN_DISABLED`)
- `getUserInfo` requiring the ID token's `sub` to match userinfo's `sub`
- a route filter allowing only `{ provider, callbackURL }` as plain JSON

`/link-social`, which has a similar branch, is now in `disabledAuthPaths`.

## Checking a fork

If your fork keeps upstream history:

```bash
# F3b: affected if the first prints and the second does not.
git merge-base --is-ancestor ee46343 HEAD && echo "has F3 (F3b applies)"
git merge-base --is-ancestor b7dc8e6 HEAD && echo "has the F3b fix"
# F12 (better-auth 1.7.x + discoveryUrl): affected unless this prints.
git merge-base --is-ancestor cf5a824 HEAD && echo "has the F12 fix"
```

If it does not (a copied or squashed fork), check the code instead:

```bash
grep -rF 'startsWith("/\\")' src/                          # prints = F3b applies (the check lived in src/app/signin/page.tsx before F9)
grep -n "ID_TOKEN_SIGN_IN_DISABLED" src/lib/auth.ts           # absent + better-auth 1.7 + discoveryUrl = F12 applies
```

Porting steps, snippets and tests are in the
[Downstream Hardening Playbook](downstream-hardening-playbook.md), under F3 /
F3b and F12.

## Credit

Thanks to **Jonathon Huff** of **The Moody Church** for a careful, private
report.
