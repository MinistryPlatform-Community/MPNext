# Branch and Commit Command

Create a new branch from the current branch and commit all staged/unstaged changes with detailed notes. Optionally link to a GitHub issue.

## Instructions

1. First, check the current git status to see what changes exist
2. If a GitHub issue ID is provided (e.g., `#123` or just `123`):
   - Fetch the issue details using `gh issue view <id> --json title,body,labels`
   - Use the issue title and details to auto-generate:
     - Branch name: `feature/issue-<id>-<short-description>` or `fix/issue-<id>-<short-description>`
     - Commit message referencing the issue (e.g., "Fix #123: Issue title")
   - Include issue context in commit notes
3. If no issue ID provided, ask the user for:
   - Branch name (suggest a name based on the changes if possible)
   - Commit message summary (1 line)
   - Detailed notes for the commit body (optional)
4. Create the new branch from the current branch
5. Stage all changes (both tracked and untracked files)
6. Create the commit with the provided message and notes
7. Push the branch to the remote repository
8. Show the user the result including:
   - The new branch name
   - The commit hash
   - A summary of files changed
   - Link to the GitHub issue (if applicable)
   - Confirmation that the branch was pushed

## Arguments

- `$ARGUMENTS` - Optional arguments in any of these formats:
  - `#123` or `123` - GitHub issue ID (will fetch issue details and auto-generate branch/commit)
  - `branch-name: commit message` - Manual branch name and commit message
  - `#123 branch-name: commit message` - Issue ID with custom branch/commit (issue will be referenced)

## Workflow

### With GitHub Issue
```
gh issue view <id> --json title,body,labels,number
git status
git checkout -b feature/issue-<id>-<slug>
git add -A
git commit -m "Fix #<id>: <issue-title>" -m "<detailed notes from issue>"
git push -u origin feature/issue-<id>-<slug>
git log -1 --stat
```

### Without GitHub Issue
```
git status
git checkout -b <branch-name>
git add -A
git commit -m "<summary>" -m "<detailed notes>"
git push -u origin <branch-name>
git log -1 --stat
```

## Branch Naming Convention

When using a GitHub issue, the branch name will be auto-generated:
- `fix/issue-<id>-<slug>` - For bug fixes (issues with "bug" label)
- `feature/issue-<id>-<slug>` - For features/enhancements
- `<slug>` is derived from the issue title (lowercase, hyphens, max 50 chars)

## Commit Message Format

When referencing a GitHub issue:
```
<type> #<issue-id>: <issue-title>

<issue body summary or user-provided notes>

Closes #<issue-id>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Notes

- Always push the new branch to remote with `-u` flag to set upstream tracking
- Follow conventional commit format if the project uses it
- Include "Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" in commits
- Use "Closes #<id>" in commit body to auto-close the issue when merged
- If `gh` CLI is not available or issue fetch fails, fall back to manual input
