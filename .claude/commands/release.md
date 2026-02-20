# Release Command

Create a GitHub release with auto-generated release notes from merged pull requests.

## Instructions

1. **Gather context:**
   - Run `gh release list --limit 5` to find the most recent release (if any)
   - Run `git tag --sort=-version:refname | head -5` to see existing tags
   - If a previous release exists, identify its tag to scope the changelog
   - Run `git log --oneline` (from last release tag to HEAD, or recent commits if first release) to understand what's new

2. **Identify PRs to include:**
   - If this is the first release, run `gh pr list --state merged --limit 20 --json number,title,mergedAt,body,labels` to get recent merged PRs
   - If a previous release exists, find PRs merged since that release using `gh pr list --state merged --search "merged:>YYYY-MM-DD" --json number,title,mergedAt,body,labels`
   - Present the list of PRs to the user and ask which to include (default: all)

3. **Determine version:**
   - Auto-compute the version tag using calver format: `v{YYYY}.{MM}.{DD}.{HHmm}` based on the current date and time
   - Generate it with: `date -u +v%Y.%m.%d.%H%M` (UTC time)
   - Example: `v2026.02.20.1735` means 2026-02-20 at 17:35 UTC
   - Show the computed version to the user for confirmation
   - If `--tag` argument was provided, use that instead of auto-computing
   - If the computed tag already exists, append a `.1` suffix (e.g., `v2026.02.20.1735.1`)

4. **Generate release notes:**
   - Categorize included PRs by type using PR title prefixes and content:
     - `⚠️ Breaking Changes` — any PR with breaking changes (migration steps, renamed APIs, changed URLs, removed features)
     - `🚀 Features` — PRs with `feat:` prefix or feature work
     - `🐛 Bug Fixes` — PRs with `fix:` prefix or bug fixes
     - `📚 Documentation` — PRs with `docs:` prefix or doc-only changes
     - `🔧 Maintenance` — dependency updates, refactoring, CI changes, chores
   - For each PR, write a concise summary line: `**Short title** (#number) — One-sentence description.`
   - Pull the description from the PR body's Summary section if available
   - Only include categories that have PRs in them
   - Ask the user if there are any breaking changes or additional notes to add

5. **Review with user:**
   - Show the complete draft release notes to the user
   - Ask if any edits are needed before publishing
   - Apply any requested changes

6. **Create the release:**
   - Run `gh release create <tag> --target main --title "<tag>" --notes "<notes>"`
   - Use a HEREDOC for the notes body to handle multiline content
   - Run `git fetch --tags` to sync the new tag locally

7. **Post-creation:**
   - Display the release URL
   - Confirm tag is synced locally
   - Show summary of what was released

## Arguments

- `$ARGUMENTS` - Optional arguments:
  - `--tag <version>` - Specify version tag directly (skip version prompt)
  - `--draft` - Create as draft release
  - `--prerelease` - Mark as pre-release
  - `--target <branch>` - Target branch (default: `main`)
  - `--since <tag>` - Override: include PRs since this tag instead of auto-detecting

## Release Notes Format

```markdown
## What's Changed

### ⚠️ Breaking Changes

- **Description of breaking change** (#PR) — What changed and what action users must take.

### 🚀 Features

- **Feature title** (#PR) — Brief description of the feature.

### 🐛 Bug Fixes

- **Fix title** (#PR) — Brief description of what was fixed.

### 📚 Documentation

- **Doc change title** (#PR) — Brief description of doc changes.

### 🔧 Maintenance

- **Maintenance title** (#PR) — Brief description of maintenance work.

**Full Changelog**: https://github.com/OWNER/REPO/compare/PREVIOUS_TAG...NEW_TAG
```

## Example Workflow

```bash
# 1. Check existing releases and tags
gh release list --limit 5
git tag --sort=-version:refname | head -5

# 2. Get merged PRs since last release
gh pr list --state merged --limit 20 --json number,title,mergedAt,body,labels

# 3. Get repo info for changelog URL
gh repo view --json nameWithOwner --jq .nameWithOwner

# 4. Create the release
gh release create v2026.02.20.1735 --target main --title "v2026.02.20.1735" --notes "$(cat <<'EOF'
## What's Changed

### 🚀 Features

- **New feature** (#44) — Description of the feature.

### 🐛 Bug Fixes

- **Bug fix** (#40) — Description of the fix.

**Full Changelog**: https://github.com/owner/repo/compare/v0.1.0...v2026.02.20.1735
EOF
)"

# 5. Sync tag locally
git fetch --tags
```

## Error Handling

- If `gh` CLI is not installed or not authenticated, provide instructions for setup
- If no merged PRs are found since the last release, inform the user and ask how to proceed
- If the tag already exists, warn the user and ask if they want to use a different tag
- If release creation fails, show the error and suggest fixes

## Notes

- Always use HEREDOC for release notes to handle multiline content and special characters
- Include the Full Changelog comparison link at the bottom when a previous release exists
- Default target branch is `main` — confirm with user if the repo uses a different default
- Sync tags locally after creating the release so `git describe` and local tooling work correctly
- When categorizing PRs, prefer using the PR title prefix (feat:, fix:, docs:, chore:) but fall back to analyzing the PR body content
- Ask about breaking changes explicitly — they're easy to miss but critical for users upgrading
