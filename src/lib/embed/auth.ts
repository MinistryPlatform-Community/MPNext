/**
 * Authentication middleware for embed widgets
 */

import { NextRequest } from "next/server";
import { verifyWidgetToken } from "./jwt";
import { getTenantConfig } from "./config";
import { WidgetClaims } from "./types";

export interface AuthOptions {
  widget: string;
  requireAuth?: boolean;
}

/**
 * Verify widget authentication and return claims
 */
export async function requireWidgetAuth(
  req: NextRequest,
  options: AuthOptions
): Promise<WidgetClaims> {
  const { widget, requireAuth = true } = options;

  // Extract token from Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new Error("Invalid Authorization header format");
  }

  const token = parts[1];
  
  // Verify JWT
  let claims: WidgetClaims;
  try {
    claims = await verifyWidgetToken(token);
  } catch (error) {
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Validate widget type
  if (claims.wid !== widget) {
    throw new Error(`Invalid widget: expected ${widget}, got ${claims.wid}`);
  }

  // Validate origin against tenant allowlist
  const origin = req.headers.get("origin") || "";
  const tenant = await getTenantConfig(claims.tid);
  
  if (!tenant) {
    throw new Error(`Tenant not found: ${claims.tid}`);
  }

  // Check if origin is allowed
  const isOriginAllowed = tenant.allowedOrigins.some(allowed => {
    // Exact match
    if (allowed === origin) return true;
    
    // Wildcard subdomain support (e.g., *.example.com)
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    
    return false;
  });

  if (!isOriginAllowed && process.env.NODE_ENV !== "development") {
    throw new Error(`Origin ${origin} not allowed for tenant ${claims.tid}`);
  }

  if (!isOriginAllowed && process.env.NODE_ENV === "development") {
    console.warn(`⚠️ DEV MODE: Origin ${origin} not in allowlist, allowing anyway`);
  }

  return claims;
}

/**
 * Get CORS headers for the response
 */
export function getCorsHeaders(origin: string, allowedOrigins: string[]): HeadersInit {
  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed === origin) return true;
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return false;
  });

  if (!isAllowed && process.env.NODE_ENV !== "development") {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key, X-Tenant-ID",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "false",
    "Vary": "Origin",
  };
}
