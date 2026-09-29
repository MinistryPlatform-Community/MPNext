# TODO: `npm run setup` can corrupt or silently weaken secrets in `.env.local`, and writes it world-readable

**Created:** 2026-09-28
**Severity:** Low — only hand-entered values are affected; the auto-generated `BETTER_AUTH_SECRET` (`randomBytes(32)`, `scripts/setup.ts:374-378`) is fine.
**Confidence:** Confirmed by repro (logic replicated exactly).
**Source:** Auth security review 2026-09-28 (MP-client and client/config reviewers, independently).
**Related:** [security-auth-secret-fallback-and-test-flag.md](security-auth-secret-fallback-and-test-flag.md)

## Finding

`scripts/setup.ts:253-273` (`updateEnvFile`), `:612`, `:620-639` (`validateEnvVars` checks only non-empty):

- `content.replace(regex, newLine)` treats `$'`, `` $` ``, `$&` in the **value** as replacement patterns. `p4ss$'word#tail` became `BETTER_AUTH_SECRET=p4ss` followed by a copy of the rest of the file (including other secrets); `` $` `` copies the preceding lines (including the OIDC secret).
- Values are written unquoted. Next's env loader expands `$VAR` and treats ` #` as a comment: a 22-char `Xy9$Qz7Lm#Kp2Vw8Rt5Nb3` loads as `"Xy9"`. better-auth only *warns* on a short secret (`create-context.mjs:44-45`), so the app boots with a 3-character signing key.
- The file is created with the default mode (0644 on POSIX).
- A hand-entered `BETTER_AUTH_SECRET` has no length/entropy check.

## Fix

- `content.replace(regex, () => newLine)`.
- Quote values and escape `\`, `"`, `$` (as `\$`) and newlines.
- Write with `{ mode: 0o600 }` (and `chmod` an existing file).
- Require ≥ 32 chars for a manually entered secret; have `setup:check` verify the *loaded* value length.

## How to verify a fix

- Rerun the replication with `p@ss$'tail` and `Xy9$Qz7Lm#Kp2Vw8Rt5Nb3`: the loaded value equals the input exactly.
