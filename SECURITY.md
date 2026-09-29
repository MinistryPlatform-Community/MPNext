# Security Policy

MPNext is a template that churches fork and copy. There is no package to
upgrade, so no Dependabot alert reaches a fork when something is fixed here —
fixes are announced through advisories in [`docs/security/`](docs/security/)
and the [Downstream Hardening Playbook](docs/security/downstream-hardening-playbook.md).

## Supported versions

| Version | Supported |
|---|---|
| `main` (latest commit) | Yes |
| Anything else — older commits, tags, forks | No. Forks are maintained by their owners; advisories here say which commit ranges are affected so you can check your own. |

## Reporting a vulnerability

**Please do not open a public issue, discussion or pull request for a
security problem.**

Report privately through **GitHub private vulnerability reporting**: the
repository's **Security** tab → **Report a vulnerability**, or directly at
<https://github.com/MinistryPlatform-Community/MPNext/security/advisories/new>.
This is the only reporting channel.

It helps to include:

- The commit (or date of your fork) you tested against, and the better-auth and
  Next.js versions from your lockfile
- The affected file(s) and a description of the mechanism
- Steps to reproduce or a proof of concept — against a **non-production**
  instance or a mock; please never test against a live Ministry Platform
  database with real member data
- The impact as you understand it, and any fix you have in mind
- Whether you have found the same issue in a downstream fork, and whether
  that fork's maintainer knows

## What to expect

- **Acknowledgement** within **5** business days.
- **Initial assessment** — whether we can reproduce it, and a severity — within
  **10** business days.
- Status updates at least every **14** days until it is resolved.
- If we decline to treat it as a vulnerability, we will say why.

## Coordinated disclosure

We ask that you give us a reasonable window to fix the issue and to reach
downstream maintainers before you disclose publicly — by default **90** days
from acknowledgement, or sooner once a fix is on `main` and an advisory is
published, whichever comes first. We will agree the date with you. Because the
affected population is forks rather than installs, the advisory is the
notification: we publish it with the fix, stating the affected commit range and
how to check a fork.

## Credit

Reporters are credited by name (and organization, if you like) in the advisory
and in the fix commit, unless you ask to remain anonymous.
