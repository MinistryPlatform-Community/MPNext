'use server';

import { DomainTimezoneService } from '@/services/domainTimezoneService';

/**
 * Returns the IANA time zone identifier for the active Ministry Platform
 * domain. Use this to drive any client-side `Intl.DateTimeFormat` rendering
 * of MP-sourced datetime values so the displayed wall-clock matches MP's
 * database regardless of the user's browser zone.
 *
 * Result is cached for the lifetime of the server process.
 */
export async function getMpTimezone(): Promise<string> {
  const tz = DomainTimezoneService.getInstance();
  return tz.getMpTimezone();
}
