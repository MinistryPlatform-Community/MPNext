# Dependency Audit Command

Review package.json for security vulnerabilities and available updates.

## Instructions

Perform a comprehensive security and update audit of the project's dependencies:

### 1. Vulnerability Analysis
- Run `npm audit` to identify known vulnerabilities
- Search the web for recent CVEs affecting major dependencies (Next.js, React, auth libraries, ORMs)
- Check Snyk and NVD databases for any critical issues
- Classify vulnerabilities by severity (Critical, High, Moderate, Low)

### 2. Update Analysis
- Run `npm outdated` to identify available updates
- Categorize updates as:
  - **Safe updates**: Patch and minor versions that can be applied immediately
  - **Major updates**: Require evaluation of breaking changes and migration effort

### 3. Use Context7
- Query Context7 for migration guides and breaking changes for any major version updates
- Check official documentation for upgrade paths

### 4. Generate Report
Provide a structured report with:

#### Security Issues (by severity)
- Critical/High: Immediate action required with specific fix commands
- Moderate/Low: Assessment of risk and recommended timeline

#### Recommended Updates
| Package | Current | Latest | Risk Level | Notes |
|---------|---------|--------|------------|-------|

#### Action Plan
1. **Urgent**: Commands to fix critical vulnerabilities
2. **Soon**: Safe updates to apply
3. **Plan for**: Major version upgrades requiring testing

### 5. Optional Execution
If the user requests, execute the recommended action plan:
- Apply safe updates
- Run `npm run build` to verify no breaking changes
- Run `npm run lint` to check for issues
- Report final status

## Key Dependencies to Always Check
- next / next-auth (framework security)
- react / react-dom (core framework)
- jsonwebtoken / bcryptjs (auth/crypto)
- drizzle-orm / drizzle-kit (database)
- Any AWS SDK packages
- Any packages with known historical vulnerabilities
