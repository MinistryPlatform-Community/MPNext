/**
 * Pledge submission endpoint for embed widgets
 * POST /api/embed/pledge/submit
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWidgetAuth, getCorsHeaders } from "@/lib/embed/auth";
import { getTenantConfig } from "@/lib/embed/config";
import { savePledge, type PledgeFormData } from "@/components/pledge/actions";

// In-memory cache for idempotency (use Redis/Vercel KV in production)
import { PledgeResult } from "@/components/pledge/actions";

const idempotencyCache = new Map<string, { result: PledgeResult; timestamp: number }>();
const IDEMPOTENCY_TTL = 86400000; // 24 hours in milliseconds

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyCache.delete(key);
    }
  }
}, 3600000); // Clean every hour

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  try {
    // Authenticate widget request
    const auth = await requireWidgetAuth(req, { widget: "pledge" });
    
    // Check idempotency key
    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: "Missing Idempotency-Key header" },
        { status: 400 }
      );
    }

    // Check if we've already processed this request
    const cacheKey = `${auth.tid}:${idempotencyKey}`;
    const cached = idempotencyCache.get(cacheKey);
    
    if (cached) {
      console.log(`Returning cached response for idempotency key: ${idempotencyKey}`);
      const tenant = await getTenantConfig(auth.tid);
      return NextResponse.json(cached.result, {
        status: 200,
        headers: getCorsHeaders(origin, tenant?.allowedOrigins || []),
      });
    }

    // Parse and validate request body
    const data: PledgeFormData = await req.json();

    // Basic validation
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate campaign ID matches
    if (!data.campaignId) {
      return NextResponse.json(
        { error: "Missing campaign ID" },
        { status: 400 }
      );
    }

    // Call existing pledge save logic
    console.log(`Processing pledge for tenant ${auth.tid}, widget ${auth.wid}`);
    const result = await savePledge(data);

    // Cache the result
    idempotencyCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    // Get CORS headers
    const tenant = await getTenantConfig(auth.tid);
    const headers = getCorsHeaders(origin, tenant?.allowedOrigins || []);

    return NextResponse.json(result, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error processing pledge submission:", error);

    // Try to get the actual tenant for proper CORS headers
    let corsHeaders: HeadersInit = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key, X-Tenant-ID",
    };

    try {
      const tenantId = req.headers.get("x-tenant-id");
      if (tenantId) {
        const tenant = await getTenantConfig(tenantId);
        if (tenant) {
          corsHeaders = getCorsHeaders(origin, tenant.allowedOrigins);
        }
      }
    } catch {
      // Use default CORS headers if tenant lookup fails
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: error instanceof Error && error.message.includes("Invalid") ? 403 : 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key, X-Tenant-ID",
      "Access-Control-Max-Age": "86400",
    },
  });
}
