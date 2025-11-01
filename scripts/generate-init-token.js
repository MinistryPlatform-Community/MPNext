#!/usr/bin/env node
/**
 * Generate Init Token for Embed Widget
 * Usage: node scripts/generate-init-token.js <tenant-id>
 */

const crypto = require('crypto');

const tenantId = process.argv[2];

if (!tenantId) {
  console.error('❌ Error: Tenant ID is required');
  console.log('Usage: node scripts/generate-init-token.js <tenant-id>');
  console.log('Example: node scripts/generate-init-token.js northwoods-prod');
  process.exit(1);
}

// Generate 32 random bytes (256 bits)
const randomBytes = crypto.randomBytes(32);
const hex = randomBytes.toString('hex');

// Create token
const token = `${tenantId}_${hex}`;

console.log('');
console.log('✅ Generated Init Token for tenant:', tenantId);
console.log('');
console.log('Token:');
console.log(token);
console.log('');
console.log('Add this to your embed code:');
console.log(`  initToken: "${token}"`);
console.log('');
