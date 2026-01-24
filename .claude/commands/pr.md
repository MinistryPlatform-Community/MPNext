# Pull Request Command

Create a pull request for the current branch after validating all prerequisites are met.

## Instructions

1. **Validate branch state:**
   - Check current branch name - must NOT be `main`, `master`, or `dev`
   - If on main/master/dev, abort and inform the user to create/switch to a feature branch first

2. **Check for uncommitted changes:**
   - Run `git status` to check for staged or unstaged changes
   - If uncommitted changes exist, ask the user if they want to:
     - Commit them first (offer to run /branch-commit)
     - Stash them and continue
     - Abort the PR creation

3. **Check if branch is pushed to origin:**
   - Run `git ls-remote --heads origin <branch-name>` to verify branch exists on remote
   - If not pushed, offer to push with `git push -u origin <branch-name>`
   - Verify local branch is up to date with remote (no unpushed commits)

4. **Check if PR already exists:**
   - Run `gh pr list --head <branch-name> --state open --json number,title,url`
   - If PR exists, show the existing PR details and ask if user wants to view it
   - Abort PR creation if one already exists

5. **Gather PR information:**
   - Get the base branch (usually `main`) - confirm with user if needed
   - Run `git log <base>..HEAD --oneline` to see commits being included
   - Run `git diff <base>...HEAD --stat` to see files changed
   - Look for linked GitHub issues in commit messages (patterns like `#123`, `Fix #123`, `Closes #123`)

6. **Generate PR content:**
   - If a linked issue is found, fetch issue details with `gh issue view <id> --json title,body,labels`
   - Generate a title based on:
     - Linked issue title (if available)
     - Or summarize from commit messages
   - Generate body with:
     - Summary section (2-3 bullet points describing changes)
     - Test plan section (checklist of testing items)
     - Link to issue (if applicable)
     - Footer with Claude Code attribution

7. **Create the PR:**
   - Use `gh pr create --title "<title>" --body "<body>" --base <base-branch>`
   - Show the created PR URL to the user

8. **Post-creation:**
   - Display the PR URL
   - Show summary of what was included

## Arguments

- `$ARGUMENTS` - Optional arguments:
  - `--base <branch>` - Specify base branch (default: dev)
  - `--draft` - Create as draft PR
  - `--title "<title>"` - Override auto-generated title
  - `#123` or `123` - Link to specific GitHub issue (overrides auto-detection)

## Validation Checklist

Before creating PR, ensure all checks pass:
- [ ] Not on main/master/dev branch
- [ ] No uncommitted changes (or handled)
- [ ] Branch exists on origin
- [ ] No unpushed commits
- [ ] No existing open PR for this branch

## PR Format

```markdown
## Summary
<2-3 bullet points describing the changes>

## Test plan
- [ ] <Testing item 1>
- [ ] <Testing item 2>
- [ ] <Testing item 3>

---
Closes #<issue-id> (if applicable)

Generated with [Claude Code](https://claude.ai/code)
```

## Example Workflow

```bash
# 1. Check current branch
git branch --show-current

# 2. Check for uncommitted changes
git status --porcelain

# 3. Check if branch exists on remote
git ls-remote --heads origin $(git branch --show-current)

# 4. Check for unpushed commits
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null

# 5. Check for existing PR
gh pr list --head $(git branch --show-current) --state open --json number,title,url

# 6. Get commits for this branch
git log main..HEAD --oneline

# 7. Get diff stats
git diff main...HEAD --stat

# 8. Create the PR
gh pr create --title "Title" --body "$(cat <<'EOF'
## Summary
- Change 1
- Change 2

## Test plan
- [ ] Test item

Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

## Error Handling

- If `gh` CLI is not installed or not authenticated, provide instructions for setup
- If any validation fails, clearly explain what needs to be fixed
- Always show the user what commands would be run before executing them

## Notes

- Always confirm the base branch with the user if it's not `main`
- Include "Generated with [Claude Code](https://claude.ai/code)" in PR body
- Use HEREDOC for PR body to handle multiline content and special characters
- If commits reference an issue with "Fix #X" or "Closes #X", include that reference in the PR
