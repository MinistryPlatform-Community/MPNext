# Docker Deployment Guide

This project supports both production deployment and local development using Docker.

## Files Overview

- **`Dockerfile`** - Production multi-stage build
- **`Dockerfile.dev`** - Development build for hot reload
- **`docker-compose.yml`** - Production configuration with Caddy network
- **`docker-compose.override.yml`** - Development overrides for Codespaces/local testing

## Development in VS Code Codespace

The override file automatically configures the environment for development with:
- Hot reload via volume mounts
- Dev server (`npm run dev`) instead of production build
- Direct port access without external network
- File watching enabled for containers

### Start development environment:

```bash
# Ensure .env file exists
cp .env.example .env
# Edit .env with your Ministry Platform credentials

# Start in development mode (override file is automatically used)
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f mp-charts

# Stop
docker-compose down
```

### Access the application:

In Codespaces, VS Code will automatically forward port 3000. Look for the "Ports" tab in the terminal panel.

### Run commands inside the container:

```bash
# Generate Ministry Platform types
docker-compose exec mp-charts npm run mp:generate:models

# Run tests
docker-compose exec mp-charts npm test

# Install new packages
docker-compose exec mp-charts npm install <package-name>

# Access shell
docker-compose exec mp-charts sh
```

### Rebuild after dependency changes:

```bash
docker-compose down
docker-compose up --build
```

## Production Deployment

For production deployment with Cloudflare Tunnel (or other reverse proxy):

### 1. Remove or rename the override file:

```bash
# Option 1: Remove it
rm docker-compose.override.yml

# Option 2: Rename it to keep for later
mv docker-compose.override.yml docker-compose.override.yml.disabled
```

### 2. Ensure the network exists:

```bash
docker network create caddy_network
```

> **Note**: The network is named `caddy_network` for legacy/consistency reasons, but it works with any reverse proxy (Caddy, Cloudflare Tunnel, Nginx, etc.).

### 3. Pull the latest image:

```bash
docker-compose pull
```

### 4. Start production container:

```bash
docker-compose up -d
```

### 5. Configure your reverse proxy:

The container runs on port **3000** internally and is accessible by container name: `mp-charts`

**For Cloudflare Tunnel:**
```bash
# In your cloudflared tunnel configuration
cloudflared tunnel route dns <tunnel-name> your-domain.com

# Configure the tunnel to route to:
# Service: http://mp-charts:3000
```

**For Caddy (if still using):**
```caddyfile
your-domain.com {
    reverse_proxy mp-charts:3000
}
```

**For Nginx:**
```nginx
location / {
    proxy_pass http://mp-charts:3000;
}
```

## CI/CD with GitHub Actions

This project includes automated Docker image building and deployment using GitHub Actions.

### Automated Workflow

The workflow (`.github/workflows/docker-build-push.yml`) automatically:

1. **Triggers on**:
   - Pushes to `main` branch
   - Pull requests to `main` branch

2. **Build process**:
   - Multi-platform build (linux/amd64, linux/arm64)
   - Uses Docker Buildx for efficient caching
   - Pushes image with Git SHA tag: `registry.gitlab.com/moodychurch/mp-charts:<sha>`

3. **Security scanning**:
   - Scans image with Trivy for vulnerabilities
   - Fails build on CRITICAL or HIGH severity issues
   - Ignores unfixed vulnerabilities

4. **Tagging strategy**:
   - Every build gets SHA tag (e.g., `abc123def`)
   - `latest` tag only pushed on main branch commits
   - Pull requests build and scan but don't push `latest`

### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | How to Generate |
|-------------|-------------|-----------------|
| `GITLAB_DEPLOY_USERNAME` | GitLab username for registry | Your GitLab username or `gitlab-ci-token` |
| `GITLAB_DEPLOY_TOKEN` | GitLab deploy token | Create at GitLab Project → Settings → Repository → Deploy Tokens |

### Creating GitLab Deploy Token

1. Go to your GitLab project: `https://gitlab.com/moodychurch/mp-charts`
2. Navigate to **Settings** → **Repository** → **Deploy Tokens**
3. Create token with:
   - **Name**: `github-actions-deploy`
   - **Scopes**: `read_registry`, `write_registry`
   - **Expiration**: Set appropriate date or leave blank
4. Save the token (you'll only see it once!)
5. Add to GitHub secrets:
   - `GITLAB_DEPLOY_USERNAME`: Use the username shown (or your GitLab username)
   - `GITLAB_DEPLOY_TOKEN`: The generated token

### Pulling Images

After the workflow runs, pull images from GitLab Container Registry:

```bash
# Login to GitLab registry
docker login registry.gitlab.com

# Pull latest image
docker pull registry.gitlab.com/moodychurch/mp-charts:latest

# Pull specific SHA
docker pull registry.gitlab.com/moodychurch/mp-charts:abc123def
```

### Using Pre-built Images

The production `docker-compose.yml` is already configured to use the GitLab Container Registry:

```yaml
services:
  mp-charts:
    image: registry.gitlab.com/moodychurch/mp-charts:latest
    restart: unless-stopped
    env_file:
      - .env
    networks:
      - caddy_network
```

**To deploy or update:**

```bash
# Pull latest image from registry
docker-compose pull

# Restart with new image
docker-compose up -d

# View logs
docker-compose logs -f mp-charts
```

**To use a specific version:**

```yaml
services:
  mp-charts:
    image: registry.gitlab.com/moodychurch/mp-charts:abc123def  # Use specific SHA
```

### Workflow Features

- **Build caching**: Uses registry cache for faster builds
- **Multi-platform**: Supports both AMD64 and ARM64 architectures
- **Security first**: Builds fail if critical vulnerabilities detected
- **PR testing**: Pull requests are built and scanned without pushing
- **Reproducible**: SHA tags allow exact version tracking

## Dependency Management with Dependabot

This project uses Dependabot to automatically keep dependencies up-to-date and secure.

### What Dependabot Monitors

The configuration (`.github/dependabot.yml`) monitors three areas:

1. **GitHub Actions** (weekly)
   - Updates workflow actions (e.g., `actions/checkout@v4` → `@v5`)
   - Ensures CI/CD pipeline uses latest secure versions

2. **Docker Base Images** (weekly)
   - Updates `node:20-alpine` in Dockerfiles
   - Keeps container base images patched

3. **npm Dependencies** (weekly)
   - Updates packages in `package.json` and `package-lock.json`
   - Groups minor/patch updates to reduce PR noise
   - Major version updates get individual PRs

### How It Works

- **Automatic PRs**: Dependabot creates pull requests for updates
- **Security Priority**: Security updates are created immediately
- **Grouped Updates**: Minor and patch updates grouped together
- **Release Notes**: Each PR includes changelog and compatibility info
- **CI Testing**: All PRs run through the full CI pipeline (build, scan, test)

### Managing Dependabot PRs

```bash
# Review the PR on GitHub
# Check CI status (all checks must pass)
# Review changelog and breaking changes

# Merge via GitHub UI or:
gh pr merge <pr-number> --auto --squash
```

### Dependabot vs Trivy

Both tools work together for comprehensive security:

| Tool | What It Scans | When It Runs |
|------|---------------|--------------|
| **Dependabot** | Source code dependencies (npm, Docker base images, GitHub Actions) | Weekly + immediate for security |
| **Trivy** | Built Docker images (OS packages, runtime dependencies) | Every commit/PR to main |

**Example workflow:**
1. Dependabot detects vulnerable `next` package → Creates PR
2. PR triggers CI → Builds Docker image → Trivy scans image
3. Both checks pass → Merge PR → Auto-deploy with updated dependency

## Environment Variables

Required environment variables (see [.env.example](.env.example)):

```env
# NextAuth Configuration
OIDC_PROVIDER_NAME="MinistryPlatform"
OIDC_CLIENT_ID=your_client_id
OIDC_CLIENT_SECRET=your_client_secret
OIDC_WELL_KNOWN_URL=https://your-mp-instance.com/ministryplatformapi/oauth/.well-known/openid-configuration
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:3000  # Update for production

# Ministry Platform API
MINISTRY_PLATFORM_CLIENT_ID=your_client_id
MINISTRY_PLATFORM_CLIENT_SECRET=your_client_secret
MINISTRY_PLATFORM_BASE_URL=https://your-mp-instance.com/ministryplatformapi

# Public URLs
NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL=https://your-mp-instance.com/ministryplatformapi/files
NEXT_PUBLIC_APP_NAME=MPNext
```

## Troubleshooting

### Port already in use

```bash
# Check what's using port 3000
lsof -i :3000

# Stop existing Next.js dev server
# Or change port in docker-compose.override.yml
```

### Changes not reflecting

```bash
# Rebuild the container
docker-compose down
docker-compose up --build

# Clear Next.js cache
docker-compose exec mp-charts rm -rf .next
```

### Module not found errors

```bash
# Reinstall dependencies in container
docker-compose exec mp-charts npm ci

# Or rebuild from scratch
docker-compose down -v  # Remove volumes
docker-compose up --build
```

### Permission issues

The container runs as non-root user `nextjs` (UID 1001) in production. For development, it runs as root to allow volume mounts.

## Switching Between Dev and Production

### Development → Production:

```bash
docker-compose down
mv docker-compose.override.yml docker-compose.override.yml.disabled
docker-compose up -d
```

### Production → Development:

```bash
docker-compose down
mv docker-compose.override.yml.disabled docker-compose.override.yml
docker-compose up -d
```

## Docker Commands Reference

```bash
# Start services
docker-compose up              # Foreground
docker-compose up -d           # Background

# Stop services
docker-compose down            # Stop and remove containers
docker-compose down -v         # Also remove volumes

# Rebuild
docker-compose build           # Build images
docker-compose up --build      # Rebuild and start

# View logs
docker-compose logs            # All logs
docker-compose logs -f         # Follow logs
docker-compose logs mp-charts  # Service-specific logs

# Execute commands
docker-compose exec mp-charts <command>

# View running containers
docker-compose ps

# Restart service
docker-compose restart mp-charts
```

## Architecture Notes

### Production Build (Dockerfile)
- Multi-stage build for minimal image size (~150MB)
- Node.js 20 Alpine base
- Standalone output mode (no node_modules in runtime)
- Runs as non-root user for security
- Optimized layer caching
- Exposes port 3000 internally (no public ports, accessed via reverse proxy)

### Development Build (Dockerfile.dev)
- Single stage for faster builds
- Volume mounts for hot reload
- Includes all dev dependencies
- File watching enabled
- No build optimization
- Exposes port 3000 for direct access

### Network Architecture

**Production:**
- External `caddy_network` (legacy name, works with any reverse proxy)
- No ports exposed to host (Cloudflare Tunnel or reverse proxy handles routing)
- Container accessible at `http://mp-charts:3000` within the network

**Development:**
- Default bridge network (isolated)
- Port 3000 exposed to host for direct access
- Hot reload via volume mounts

## Next Steps

1. Set up your `.env` file with Ministry Platform credentials
2. Run `docker-compose up` to start development environment
3. Access http://localhost:3000 (or Codespace forwarded port)
4. Make changes and watch them hot reload
5. When ready for production, disable override file and deploy

For more information, see [README.md](README.md) and [CLAUDE.md](CLAUDE.md).
