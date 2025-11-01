# Embedding the Pledge Widget on External Websites

## Step 1: Build the Widget SDK

```bash
cd packages/embed-sdk
pnpm build
```

This creates:
- `dist/nw-embed.es.js` - Modern ES module
- `dist/nw-embed.umd.js` - Legacy UMD format

## Step 2: Upload SDK to CDN

You have several options:

### Option A: Vercel Blob Storage (Recommended)

1. Install Vercel Blob:
```bash
npm install @vercel/blob
```

2. Create upload script:
```bash
# Create packages/embed-sdk/scripts/upload-to-vercel.js
```

3. Upload:
```bash
node scripts/upload-to-vercel.js
```

### Option B: GitHub Pages (Free)

1. Create a new branch `gh-pages`:
```bash
git checkout --orphan gh-pages
git rm -rf .
cp -r packages/embed-sdk/dist/* .
git add .
git commit -m "Deploy widget SDK"
git push origin gh-pages
```

2. Enable GitHub Pages in repo settings
3. SDK will be at: `https://chriskehayias.github.io/NorthwoodsNext/nw-embed.es.js`

### Option C: Vercel Public Directory (Easiest for Testing)

1. Copy SDK to public folder:
```bash
mkdir -p public/embed-sdk
cp packages/embed-sdk/dist/* public/embed-sdk/
```

2. Commit and push:
```bash
git add public/embed-sdk
git commit -m "Add embed SDK to public folder"
git push
```

3. SDK will be at: `https://northwoods.vercel.app/embed-sdk/nw-embed.es.js`

## Step 3: Configure Tenant for External Site

Add the external website's origin to allowed list:

**File:** `src/lib/embed/config.ts`

```typescript
const TENANT_CONFIGS: Record<string, TenantConfig> = {
  "northwoods-prod": {
    id: "northwoods-prod",
    name: "Northwoods Church",
    allowedOrigins: [
      "https://northwoods.org",              // Production site
      "https://www.northwoods.org",          // WWW variant
      "http://localhost:3000",               // Local testing
      "http://localhost:5173",               // Widget demo
      // Add any other domains where widget will be embedded
    ],
    mpClientId: process.env.MINISTRY_PLATFORM_CLIENT_ID || "",
    mpClientSecret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET || "",
  },
};
```

**Commit and deploy:**
```bash
git add src/lib/embed/config.ts
git commit -m "Add production tenant configuration"
git push
```

## Step 4: Generate Init Token for Customer

The customer needs a long-lived token to authenticate with your API.

**Option A: Manual Generation (Quick)**

```bash
# In development
echo "northwoods-prod_dev-secret"

# In production, use a secure random string
echo "northwoods-prod_$(openssl rand -hex 32)"
```

**Option B: Admin Dashboard (Future)**

Create a dashboard page to manage tenants and generate tokens.

## Step 5: Provide Embed Code to Customer

Give the customer this HTML snippet to add to their website:

```html
<!-- Northwoods Pledge Widget -->
<script type="module" 
        src="https://northwoods.vercel.app/embed-sdk/nw-embed.es.js"
        data-api-host="https://northwoods.vercel.app">
</script>

<script type="module">
  import { init } from "https://northwoods.vercel.app/embed-sdk/nw-embed.es.js";
  
  init({
    tokenProvider: {
      get: async () => {
        const res = await fetch("https://northwoods.vercel.app/api/embed/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tid: "northwoods-prod",
            wid: "pledge",
            initToken: "PASTE_INIT_TOKEN_HERE"  // From Step 4
          })
        });
        const data = await res.json();
        return data.token;
      },
      refresh: async () => {
        const res = await fetch("https://northwoods.vercel.app/api/embed/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tid: "northwoods-prod",
            wid: "pledge",
            initToken: "PASTE_INIT_TOKEN_HERE"
          })
        });
        const data = await res.json();
        return data.token;
      }
    }
  });
</script>

<!-- Place widget anywhere on the page -->
<nw-pledge campaign-id="115"></nw-pledge>

<script>
  // Optional: Listen to events
  document.querySelector("nw-pledge").addEventListener("pledgeSubmitted", (e) => {
    console.log("Pledge submitted:", e.detail);
    // Send to Google Analytics, show custom message, etc.
    gtag('event', 'pledge_submitted', {
      pledge_id: e.detail.pledgeId,
      total: e.detail.total
    });
  });
</script>
```

## Step 6: Test the Integration

### Local Test

1. Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Testing Pledge Widget</h1>
  
  <!-- Copy embed code from Step 5 here -->
  
</body>
</html>
```

2. Serve it locally:
```bash
npx http-server -p 8080
```

3. Open http://localhost:8080 in browser

4. Check browser console for any errors

### Production Test

1. Have customer add code to their test/staging site
2. Verify widget loads
3. Fill out form and submit
4. Check Ministry Platform for pledge record

## Troubleshooting

### "Failed to fetch" Error

**Cause:** CORS or origin not allowed  
**Fix:** Add customer's domain to `allowedOrigins` in `src/lib/embed/config.ts`

### "Invalid token" Error

**Cause:** Wrong init token or tenant ID  
**Fix:** Verify `tid` and `initToken` match what's in config

### Widget Not Visible

**Cause:** Script loading issue  
**Fix:** Check browser console, verify CDN URL is accessible

### Styles Not Applied

**Cause:** Shadow DOM isolation working correctly  
**Fix:** This is expected - widget styles won't be affected by host page

## Environment Variables

Ensure these are set in Vercel:

```bash
EMBED_JWT_SECRET=<random-256-bit-string>
EMBED_INIT_TOKEN_SECRET=<random-256-bit-string>
MINISTRY_PLATFORM_BASE_URL=https://your-mp-instance.com
MINISTRY_PLATFORM_CLIENT_ID=<your-client-id>
MINISTRY_PLATFORM_CLIENT_SECRET=<your-client-secret>
MINISTRY_PLATFORM_SERVICE_TOKEN=<optional-service-account-token>
```

## Security Checklist

- [ ] HTTPS only (no HTTP in production)
- [ ] Origin allowlist configured per tenant
- [ ] JWT secret is random and secure
- [ ] Init tokens are unique per customer
- [ ] Rate limiting enabled (future)
- [ ] Error messages don't leak sensitive info

## Analytics

Track widget usage with custom events:

```javascript
// On customer's site
widget.addEventListener("pledgeSubmitted", (e) => {
  // Google Analytics
  gtag('event', 'pledge_submitted', {
    value: parseFloat(e.detail.total),
    currency: 'USD'
  });
  
  // Facebook Pixel
  fbq('track', 'Purchase', {
    value: e.detail.total,
    currency: 'USD'
  });
});
```

## Next Steps

1. **Version Management**: Tag releases (v1.0.0, v1.1.0)
2. **CDN Caching**: Set proper cache headers
3. **Monitoring**: Setup error tracking (Sentry)
4. **Documentation**: Create customer-facing docs site
5. **Support**: Create support email/form for widget issues

---

**Need Help?**
- Widget not loading? Check browser console
- CORS errors? Verify origin is in allowlist
- Pledge not saving? Check server logs in Vercel
