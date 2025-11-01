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
    const claims = await simpleJWT.verify(token, JWT_SECRET);
    
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
  async sign(payload: WidgetClaims, secret: string): Promise<string> {
    const header = { alg: JWT_ALGORITHM, typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = base64UrlEncode(
      await createHmacSignature(`${encodedHeader}.${encodedPayload}`, secret)
    );
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },

  async verify(token: string, secret: string): Promise<WidgetClaims> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = base64UrlEncode(
      await createHmacSignature(`${encodedHeader}.${encodedPayload}`, secret)
    );

    if (signature !== expectedSignature) {
      throw new Error("Invalid signature");
    }

    return JSON.parse(base64UrlDecode(encodedPayload)) as WidgetClaims;
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

async function createHmacSignature(data: string, secret: string): Promise<string> {
  // Use Web Crypto API (works in Node.js and Edge Runtime)
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    return Buffer.from(signature).toString("base64");
  } catch {
    // Fallback for environments without Web Crypto API
    console.warn("⚠️ Using insecure JWT signing - implement proper HMAC for production");
    return Buffer.from(data + secret).toString("base64");
  }
}
