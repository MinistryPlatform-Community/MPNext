# Embed Widget Authentication System

## Overview

This directory contains the authentication and authorization system for embeddable widgets.

## Architecture

```
Customer Website → Widget (Shadow DOM) → Next.js API → Ministry Platform
                                       ↓
                                  JWT Auth + CORS
```

## Files

- **`types.ts`** - TypeScript interfaces for widget claims, tenant config
- **`config.ts`** - Tenant configuration and init token validation
- **`jwt.ts`** - JWT creation and verification (HS256)
- **`auth.ts`** - Authentication middleware for API routes

## Flow

### 1. Widget Initialization

Customer embeds the widget:
```html
<script type="module" src="https://cdn.northwoods.com/embed-sdk@1.0.0/nw-embed.es.js"></script>
<nw-pledge campaign-id="115"></nw-pledge>
```

### 2. Token Exchange

Widget calls `/api/embed/session` with:
- `tid` - Tenant ID (e.g., "northwoods-dev")
- `wid` - Widget ID (e.g., "pledge")
- `initToken` - Long-lived token from admin dashboard

Server validates and returns:
- Short-lived JWT (5 minutes)
- Ministry Platform access token embedded in JWT

### 3. API Calls

Widget makes requests with:
- `Authorization: Bearer <jwt>`
- `Idempotency-Key: <uuid>` (for writes)
- `X-Tenant-ID: <tid>`

Server validates:
- JWT signature and expiry
- Widget type matches endpoint
- Origin is in tenant's allowlist
- Idempotency key (prevents duplicates)

## Tenant Configuration

Add tenants in `config.ts`:

```typescript
{
  "northwoods-prod": {
    id: "northwoods-prod",
    name: "Northwoods Church",
    allowedOrigins: [
      "https://northwoods.org",
      "https://www.northwoods.org"
    ],
    mpClientId: "...",
    mpClientSecret: "..."
  }
}
```

## Generating Init Tokens

In your admin dashboard:

```typescript
import { generateInitToken } from "@/lib/embed/config";

// Generate token for a tenant
const initToken = generateInitToken("northwoods-prod");
// Returns: "northwoods-prod_<secret>"

// Give this to the customer for embedding
```

## Security Features

✅ **Short-lived JWTs** - 5-minute expiry, auto-refresh  
✅ **Origin validation** - CORS enforced per tenant  
✅ **Idempotency** - Duplicate request prevention  
✅ **No cookies** - Pure bearer auth (no CSRF risk)  
✅ **Shadow DOM** - Complete style isolation  

## Development

For local testing, use:
- Tenant ID: `northwoods-dev`
- Init Token: `northwoods-dev_dev-secret`
- Allowed Origins: `http://localhost:*`

## Production Checklist

- [ ] Replace in-memory idempotency cache with Redis/Vercel KV
- [ ] Store tenant configs in database
- [ ] Use RS256 JWT with key rotation
- [ ] Implement proper init token generation/validation
- [ ] Add rate limiting per tenant
- [ ] Setup monitoring and alerts
- [ ] Implement token revocation list
- [ ] Add webhook for pledge notifications
- [ ] PII encryption at rest
- [ ] Audit logging for all write operations

## Environment Variables

```bash
EMBED_JWT_SECRET=<random-256-bit-string>
EMBED_INIT_TOKEN_SECRET=<random-256-bit-string>
MINISTRY_PLATFORM_SERVICE_TOKEN=<optional-for-public-widgets>
```

## API Endpoints

### POST /api/embed/session
Issue short-lived JWT token

**Request:**
```json
{
  "tid": "northwoods-dev",
  "wid": "pledge",
  "initToken": "northwoods-dev_dev-secret"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "expiresIn": 300
}
```

### POST /api/embed/pledge/submit
Submit a pledge

**Headers:**
```
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
Content-Type: application/json
```

**Request:**
```json
{
  "campaignId": 115,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "pledgeId": 12345,
  "message": "Pledge saved successfully"
}
```

## Debugging

Enable debug logging:
```typescript
// In widget demo.html
init({
  tokenProvider: {
    get: async () => {
      console.log("🔑 Fetching token...");
      const res = await fetch("/api/embed/session", { ... });
      const data = await res.json();
      console.log("✅ Token received:", data);
      return data.token;
    }
  }
});
```

Check server logs for:
- Token validation failures
- Origin blocking
- Idempotency hits
- Ministry Platform API errors
