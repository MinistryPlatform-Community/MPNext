/**
 * Tenant configuration for embed widgets
 * In production, this would be stored in a database
 */

import { TenantConfig } from "./types";

// Mock tenant configs - replace with database lookup
const TENANT_CONFIGS: Record<string, TenantConfig> = {
  "northwoods-dev": {
    id: "northwoods-dev",
    name: "Northwoods Church (Dev)",
    allowedOrigins: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ],
    mpClientId: process.env.MINISTRY_PLATFORM_CLIENT_ID || "",
    mpClientSecret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET || "",
  },
  "northwoods-prod": {
    id: "northwoods-prod",
    name: "Northwoods Church",
    allowedOrigins: [
      "https://northwoods.org",
      "https://www.northwoods.org",
    ],
    mpClientId: process.env.MINISTRY_PLATFORM_CLIENT_ID || "",
    mpClientSecret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET || "",
  },
};

export async function getTenantConfig(
  tenantId: string
): Promise<TenantConfig | null> {
  // TODO: Replace with database query
  // const config = await prisma.tenantConfig.findUnique({ where: { id: tenantId } });
  return TENANT_CONFIGS[tenantId] || null;
}

export async function validateInitToken(
  tenantId: string,
  initToken: string
): Promise<TenantConfig | null> {
  // TODO: Implement proper init token validation
  // This would typically:
  // 1. Verify the token signature
  // 2. Check it's not expired
  // 3. Ensure it's for the correct tenant
  // 4. Verify it hasn't been revoked

  // For now, simple validation
  if (!initToken || initToken.length < 20) {
    return null;
  }

  const tenant = await getTenantConfig(tenantId);
  if (!tenant) {
    return null;
  }

  // TODO: Add real token validation here
  // For development, we'll accept any token matching pattern
  const expectedToken = `${tenantId}_${process.env.EMBED_INIT_TOKEN_SECRET || "dev-secret"}`;
  
  if (initToken !== expectedToken) {
    console.warn(`Invalid init token for tenant ${tenantId}`);
    // In development, we'll still return the tenant for testing
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ DEV MODE: Allowing invalid token for development");
      return tenant;
    }
    return null;
  }

  return tenant;
}

export function generateInitToken(tenantId: string): string {
  // Generate a long-lived init token for a tenant
  // This would be done in your admin dashboard
  return `${tenantId}_${process.env.EMBED_INIT_TOKEN_SECRET || "dev-secret"}`;
}
