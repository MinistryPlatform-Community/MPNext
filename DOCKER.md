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

For production deployment with Caddy reverse proxy:

### 1. Remove or rename the override file:

```bash
# Option 1: Remove it
rm docker-compose.override.yml

# Option 2: Rename it to keep for later
mv docker-compose.override.yml docker-compose.override.yml.disabled
```

### 2. Ensure Caddy network exists:

```bash
docker network create caddy_network
```

### 3. Update docker-compose.yml if needed:

Remove the `ports:` section if Caddy handles all routing:

```yaml
services:
  mp-charts:
    # ... other config ...
    # ports:  # Remove this section
    #   - "3000:3000"
    networks:
      - caddy_network
```

### 4. Start production container:

```bash
docker-compose up -d
```

### 5. Configure Caddy:

Add to your Caddyfile:

```caddyfile
your-domain.com {
    reverse_proxy mp-charts:3000
}
```

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

### Development Build (Dockerfile.dev)
- Single stage for faster builds
- Volume mounts for hot reload
- Includes all dev dependencies
- File watching enabled
- No build optimization

## Next Steps

1. Set up your `.env` file with Ministry Platform credentials
2. Run `docker-compose up` to start development environment
3. Access http://localhost:3000 (or Codespace forwarded port)
4. Make changes and watch them hot reload
5. When ready for production, disable override file and deploy

For more information, see [README.md](README.md) and [CLAUDE.md](CLAUDE.md).
