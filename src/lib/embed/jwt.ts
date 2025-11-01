/**
 * JWT utilities for embed widget authentication
 */

import { WidgetClaims } from "./types";

// Note: In production, use RS256 with proper key management
// For now, we'll use HS256 with a secret from env

const JWT_SECRET = process.env.EMBED_JWT_SECRET || "development-secret-change-in-production";
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Create a JWT for widget authentication
 */
export async function createWidgetToken(claims: Omit<WidgetClaims, "iat" | "exp" | "jti">): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: WidgetClaims = {
    ...claims,
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
    jti: crypto.randomUUID(),
  };

  // For production, use a proper JWT library like 'jose' or 'jsonwebtoken'
  // For now, we'll use a simple implementation
  return simpleJWT.sign(payload, JWT_SECRET);
}

/**
 * Verify and decode a widget JWT
 */
export async function verifyWidgetToken(token: string): Promise<WidgetClaims> {
  try {
    const claims = simpleJWT.verify(token, JWT_SECRET) as WidgetClaims;
    
    // Check expiry
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    return claims;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Simple JWT implementation
 * Replace with 'jose' or 'jsonwebtoken' in production
 */
const simpleJWT = {
  sign(payload: any, secret: string): string {
    const header = { alg: JWT_ALGORITHM, typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = base64UrlEncode(
      createHmacSignature(`${encodedHeader}.${encodedPayload}`, secret)
    );
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },

  verify(token: string, secret: string): any {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = base64UrlEncode(
      createHmacSignature(`${encodedHeader}.${encodedPayload}`, secret)
    );

    if (signature !== expectedSignature) {
      throw new Error("Invalid signature");
    }

    return JSON.parse(base64UrlDecode(encodedPayload));
  },
};

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }
  // Browser fallback
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString();
  }
  return atob(str);
}

function createHmacSignature(data: string, secret: string): string {
  // This is a simplified version - use crypto.createHmac in Node.js
  // For production, import 'crypto' and use proper HMAC
  if (typeof require !== "undefined") {
    try {
      const crypto = require("crypto");
      return crypto.createHmac("sha256", secret).update(data).digest("base64");
    } catch (e) {
      // Fallback for edge runtime
    }
  }
  
  // Very basic fallback (NOT SECURE - only for development)
  console.warn("⚠️ Using insecure JWT signing - implement proper HMAC for production");
  return Buffer.from(data + secret).toString("base64");
}
