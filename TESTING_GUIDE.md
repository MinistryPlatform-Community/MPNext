# Testing Guide: Embed Widget Integration

## Prerequisites

1. **Environment Variables**

Create or update `.env.local`:
```bash
# Copy from .env.example
cp .env.example .env.local

# Add required values:
EMBED_JWT_SECRET=test-secret-change-in-production
EMBED_INIT_TOKEN_SECRET=dev-secret
MINISTRY_PLATFORM_BASE_URL=https://your-mp.com
MINISTRY_PLATFORM_CLIENT_ID=your-client-id
MINISTRY_PLATFORM_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

2. **Install Dependencies**

```bash
# Install all workspace dependencies
pnpm install

# Build the SDK
pnpm build:sdk
```

## Test 1: Standalone Widget Demo

Test the widget in isolation without Next.js integration.

```bash
cd packages/embed-sdk
npx vite demo.html
```

Open http://localhost:5173/demo.html

**Expected behavior:**
- Form renders with all fields
- Real-time total calculation works
- Validation errors show on invalid input
- ⚠️ Submission will fail (no API yet)

## Test 2: API Endpoints

Test the API endpoints directly.

### Start Next.js Server

```bash
# Terminal 1: Start Next.js
pnpm dev
```

### Test Session Endpoint

```bash
# Terminal 2: Test token generation
curl -X POST http://localhost:3000/api/embed/session \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "tid": "northwoods-dev",
    "wid": "pledge",
    "initToken": "northwoods-dev_dev-secret"
  }'
```

**Expected response:**
```json
{
  "token": "eyJhbGc...",
  "expiresIn": 300
}
```

### Test Pledge Submission

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/embed/session \
  -H "Content-Type: application/json" \
  -d '{"tid":"northwoods-dev","wid":"pledge","initToken":"northwoods-dev_dev-secret"}' \
  | jq -r '.token')

# Submit a pledge
curl -X POST http://localhost:3000/api/embed/pledge/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: test-$(uuidgen)" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "campaignId": 115,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "5555551234",
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipcode": "62701",
    "courageous_gift": "100.00",
    "consistent_gift": "500.00",
    "creative_gift": "0.00",
    "total_gift": "600.00"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "pledgeId": 12345,
  "message": "Pledge saved successfully"
}
```

## Test 3: End-to-End Integration

Full integration test with widget → API → Ministry Platform.

### Setup

```bash
# Terminal 1: Run Next.js server
pnpm dev

# Terminal 2: Run widget demo
cd packages/embed-sdk
npx vite demo.html --port 5173
```

### Test Steps

1. Open http://localhost:5173/demo.html
2. Open browser DevTools (F12) → Console tab
3. Watch for logs:
   ```
   🔑 Fetching token from API...
   ✅ Token received, expires in: 300 seconds
   Waiting for events...
   ```

4. Fill out the pledge form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Phone: (555) 555-1234
   - Address: 123 Test St
   - City: Chicago
   - State: IL
   - Zipcode: 60601
   - Courageous Gift: $100.00

5. Click "Make My Pledge"

6. **Expected Console Output:**
   ```
   POST http://localhost:3000/api/embed/pledge/submit
   Status: 200
   pledgeSubmitted { pledgeId: 12345, total: "100.00" }
   ```

7. **Expected UI:**
   - Form disappears
   - Success screen shows:
     - "Thank You!"
     - Total Commitment: $100.00
     - "Your commitment has been recorded successfully"

## Test 4: Error Handling

### Invalid Token

```bash
curl -X POST http://localhost:3000/api/embed/pledge/submit \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":115}'
```

**Expected:** 403 Forbidden
```json
{
  "success": false,
  "error": "Token verification failed: ..."
}
```

### Missing Idempotency Key

```bash
curl -X POST http://localhost:3000/api/embed/pledge/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":115}'
```

**Expected:** 400 Bad Request
```json
{
  "error": "Missing Idempotency-Key header"
}
```

### Invalid Origin

```bash
curl -X POST http://localhost:3000/api/embed/session \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"tid":"northwoods-prod","wid":"pledge","initToken":"..."}'
```

**Expected:** 403 Forbidden (in production)
**In Development:** Warning logged, request allowed

## Test 5: Idempotency

Submit the same pledge twice with the same idempotency key.

```bash
IDEM_KEY="test-duplicate-$(uuidgen)"

# First submission
curl -X POST http://localhost:3000/api/embed/pledge/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":115,...}'

# Second submission (same key)
curl -X POST http://localhost:3000/api/embed/pledge/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":115,...}'
```

**Expected:**
- Both return same `pledgeId`
- Only one pledge created in Ministry Platform
- Console shows: "Returning cached response for idempotency key: ..."

## Test 6: Token Refresh

Test automatic token refresh on expiry.

1. In `src/lib/embed/jwt.ts`, temporarily change:
   ```typescript
   const JWT_EXPIRY_SECONDS = 10; // 10 seconds for testing
   ```

2. Open demo.html
3. Fill form slowly (take >10 seconds)
4. Submit

**Expected:**
- First API call gets 401 Unauthorized
- Widget automatically fetches new token
- Retry succeeds with new token
- Console shows: "🔄 Refreshing token..."

## Test 7: CORS Validation

Test cross-origin request handling.

```bash
# Test with allowed origin
curl -X POST http://localhost:3000/api/embed/session \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"tid":"northwoods-dev","wid":"pledge","initToken":"northwoods-dev_dev-secret"}'

# Check response headers
# Should include: Access-Control-Allow-Origin: http://localhost:5173
```

## Debugging Tips

### Enable Verbose Logging

Add to widget demo:
```javascript
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});
```

### Check Network Tab

1. Open DevTools → Network
2. Filter: `/api/embed/`
3. Check for:
   - Preflight OPTIONS requests (should be 204)
   - POST requests (should be 200)
   - Response headers (CORS)

### Server Logs

Watch Next.js console for:
```
Processing pledge for tenant northwoods-dev, widget pledge
=== PLEDGE SUBMISSION START ===
✅ Pledge created successfully!
Pledge_ID: 12345
```

## Common Issues

### "Failed to get authentication token"

**Cause:** Next.js server not running  
**Fix:** Run `pnpm dev` in Terminal 1

### "Origin not allowed"

**Cause:** Origin not in tenant allowlist  
**Fix:** Add origin to `src/lib/embed/config.ts`:
```typescript
allowedOrigins: ["http://localhost:5173"]
```

### "Missing Authorization header"

**Cause:** Token provider not initialized  
**Fix:** Ensure `init()` is called before widget mounts

### CORS preflight failure

**Cause:** Missing OPTIONS handler  
**Fix:** Ensure all routes have `export async function OPTIONS()`

## Success Criteria

- ✅ Widget loads without errors
- ✅ Token fetched successfully (5-min expiry)
- ✅ Form validation works client-side
- ✅ Pledge submits to API with 200 OK
- ✅ Ministry Platform pledge created
- ✅ Success screen displays
- ✅ Event listeners fire (`pledgeSubmitted`)
- ✅ Idempotency prevents duplicates
- ✅ CORS headers present on all responses
- ✅ Token refresh works on 401

## Next Steps

After local testing passes:

1. **Production Deployment**
   - Deploy Next.js to Vercel
   - Upload SDK to CDN
   - Configure production tenant origins
   - Setup Redis for idempotency cache

2. **Customer Integration**
   - Provide embed code snippet
   - Generate production init tokens
   - Setup webhook notifications
   - Create analytics dashboard

3. **Monitoring**
   - Setup Sentry for error tracking
   - Add metrics for token issuance
   - Monitor pledge submission success rate
   - Track widget load times
