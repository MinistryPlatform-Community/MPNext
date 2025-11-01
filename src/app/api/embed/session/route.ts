/**
 * Session endpoint for issuing short-lived JWT tokens to embed widgets
 * POST /api/embed/session
 */

import { NextRequest, NextResponse } from "next/server";
import { validateInitToken, getTenantConfig } from "@/lib/embed/config";
import { createWidgetToken } from "@/lib/embed/jwt";
import { getCorsHeaders } from "@/lib/embed/auth";
import { SessionRequest, SessionResponse } from "@/lib/embed/types";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  try {
    const body: SessionRequest = await req.json();
    const { tid, wid, initToken } = body;

    if (!tid || !wid || !initToken) {
      return NextResponse.json(
        { error: "Missing required fields: tid, wid, initToken" },
        { status: 400 }
      );
    }

    // Validate init token and get tenant config
    const tenant = await validateInitToken(tid, initToken);
    if (!tenant) {
      return NextResponse.json(
        { error: "Invalid tenant or init token" },
        { status: 403 }
      );
    }

    // Check if origin is allowed
    const isOriginAllowed = tenant.allowedOrigins.some(allowed => {
      if (allowed === origin) return true;
      if (allowed.startsWith("*.")) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      return false;
    });

    if (!isOriginAllowed && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: `Origin ${origin} not allowed for tenant ${tid}` },
        { status: 403 }
      );
    }

    // Get Ministry Platform access token
    // In production, this would use a service account or cached OAuth token
    const session = await auth();
    let mpAccessToken = "";
    
    if (session?.accessToken) {
      mpAccessToken = session.accessToken;
    } else {
      // For public widgets or service account usage
      console.warn("⚠️ No user session found, using empty MP token");
      // TODO: Implement service account token retrieval
      mpAccessToken = process.env.MINISTRY_PLATFORM_SERVICE_TOKEN || "";
    }

    // Create short-lived JWT (5 minutes)
    const token = await createWidgetToken({
      sub: session?.user?.id || "public",
      tid,
      wid,
      mpAccessToken,
      origin,
    });

    const response: SessionResponse = {
      token,
      expiresIn: 300, // 5 minutes in seconds
    };

    return NextResponse.json(response, {
      status: 200,
      headers: getCorsHeaders(origin, tenant.allowedOrigins),
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  
  // For OPTIONS, we'll allow all origins and validate in POST
  // This prevents CORS preflight failures
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
