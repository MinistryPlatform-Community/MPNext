/**
 * Types for embed widget authentication and configuration
 */

export interface WidgetClaims {
  sub: string;           // User GUID or "public" for anonymous
  tid: string;           // Tenant ID (organization identifier)
  wid: string;           // Widget ID (pledge, contact-lookup, etc.)
  mpAccessToken: string; // Ministry Platform OAuth token for this tenant
  origin: string;        // Allowed embedding origin
  iat?: number;          // Issued at
  exp?: number;          // Expiry
  jti?: string;          // JWT ID for revocation
}

export interface TenantConfig {
  id: string;
  name: string;
  allowedOrigins: string[];
  mpClientId: string;
  mpClientSecret: string;
  mpAccessToken?: string;
  mpTokenExpiry?: Date;
}

export interface SessionRequest {
  tid: string;
  wid: string;
  initToken: string;
}

export interface SessionResponse {
  token: string;
  expiresIn: number;
}
