# Future Features & Improvements

Ideas and enhancements for the MPNext project. Promote items to GitHub Issues when they're ready for implementation.

## Features

### Journey/Milestone Tracker
Track current journeys from Ministry Platform and provide summary detail about what milestones have been completed. Include filters to narrow by specific journeys or milestones.

### Volunteer Processing
Provide up-to-date info about volunteer processing, particularly for children's ministry. Include an interface for staff to submit documentation like certificates and other documents/PDFs.

### Pastoral Interface for Contact Logs
A dedicated pastoral interface for viewing and managing contact logs.

## Improvements

### Dashboard Date Range Selector
Replace the hardcoded ministry year date ranges with an interactive date selector that includes comparison capabilities.

- **Two-row filter layout**:
  - **Top row (months)**: Preceding months going back in time on the left, current month button on the right
  - **Bottom row (years)**: Year buttons for selection
- **Multi-select**: Hold Ctrl/Cmd to select multiple months or years
- **Quick button**: "Ministry Year" preset (Sep–May)
- **Compare toggle**: Checkbox to compare against the previous period
  - Previous period = same selected date range but shifted back one year
  - Must handle ranges that span multiple years (e.g., Sep 2024–May 2025 compares to Sep 2023–May 2024)

## Technical Debt

### Upgrade to Next.js 16
Currently on Next.js 15.5.6. Next.js 16.1.6 LTS (Feb 2026) brings stable Turbopack for dev and build, built-in React Compiler (auto-memoization), smarter routing with layout deduplication, and file system caching for faster dev restarts. Upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16. Check NextAuth v5 beta compatibility before upgrading.

