# TODO: The `/sign-in/social` Content-Type check is looser than better-call's JSON detection (leading NBSP) — the documented invariant is false

**Created:** 2026-09-28
**Severity:** Low — not exploitable today (no keys can be smuggled), but the property the filter's soundness argument rests on doesn't hold.
**Confidence:** Confirmed by repro (including a raw-socket test showing Node passes byte 0xA0 through).
**Source:** Auth security review 2026-09-28 (HTTP-boundary reviewer).
**Related:** [security-sign-in-social-callbackurl-size-dos.md](security-sign-in-social-callbackurl-size-dos.md)

## Finding

- `src/app/api/auth/[...all]/route.ts:113` uses `contentType.split(";")[0].trim().toLowerCase()`. JS `trim()` strips U+00A0 (NBSP).
- better-call detects JSON with an anchored, untrimmed regex `/^application\/([a-z0-9.+-]*\+)?json/i` (`node_modules/better-call/dist/utils.mjs:3, 24`).
- So `Content-Type:  application/json` passes the filter, but better-call skips its JSON parser and falls through to stream/text/form parsing:
  - plain → reaches better-auth, `400 [body.provider] Invalid input`;
  - with `; x=application/x-www-form-urlencoded` → undici `formData()` throws → 500 + a `# SERVER_ERROR` log (`better-call/dist/router.mjs:93`).
- Not exploitable: undici refuses the unparseable MIME type and text/stream bodies fail zod validation. But `route.ts:102-104` and `.claude/references/auth.md:369-376` claim better-call's JSON parser always runs on the same bytes the filter read — with a leading NBSP it doesn't.
- The `,` rule isn't load-bearing: anything that passes the media-type check and contains a comma still *starts* with `application/json`, so better-call's anchored regex still selects JSON. Its two tests (`route.test.ts:273-275` and the repeated-header test) guard a case with no real differential; the NBSP gap has no test.

## Fix

- Replace the split/trim with an anchored test on the **raw** header: `/^application\/json[\t ]*(;|$)/i.test(contentType)`. Keep the comma refusal if desired, but correct its comment.
- Correct `route.ts:93-104` and `auth.md:369-376`.

## How to verify a fix

- Route tests: `" application/json"` and `" application/json; x=application/x-www-form-urlencoded"` → 404 without calling the handler.
