'use server';

import { ContactLookupDetails, ContactLogDisplay } from '@/lib/dto';
import { ContactService } from '@/services/contactService';
import { ContactLogService } from '@/services/contactLogService';
import { sanitizeNumericId } from '@/lib/providers/ministry-platform/utils/filter-sanitize';
import { AuthorizationService } from '@/services/authorizationService';

/**
 * Contact detail server actions.
 *
 * Both actions are READS, and both require an MP security role — not merely an
 * authenticated session (F1, 2026-09-12). MP's OIDC endpoint authenticates any
 * `dp_Users` record and this app reads MP with its own client-credentials
 * service account, so MP's per-user record security never applies to what these
 * return. `AuthorizationService.requireSecurityRole` implies an authenticated
 * session, so it replaces the bare session check outright. See
 * `.claude/references/auth.md` § Authorization.
 */
async function requireContactReadAccess(table: string): Promise<void> {
  await AuthorizationService.getInstance().requireSecurityRole({
    table,
    operation: 'read',
  });
}

export async function getContactDetails(guid: string): Promise<ContactLookupDetails> {
  try {
    await requireContactReadAccess('Contacts');

    if (!guid || guid.trim().length === 0) {
      throw new Error('GUID is required');
    }

    const contactService = await ContactService.getInstance();
    const contact = await contactService.getContactByGuid(guid.trim());

    if (!contact) {
      throw new Error('Contact not found');
    }

    return contact;
  } catch (error) {
    console.error('Error fetching contact details:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch contact details');
  }
}

export async function getContactLogsByContactId(contactId: number): Promise<ContactLogDisplay[]> {
  try {
    await requireContactReadAccess('Contact_Log');

    const id = sanitizeNumericId(contactId, 'Contact ID');

    const contactLogService = await ContactLogService.getInstance();
    const logs = await contactLogService.getContactLogsByContactId(id);

    // Transform to ContactLogDisplay with type information.
    //
    // The lookup table is fetched once and indexed, not once per log. The
    // `some` guard keeps the previous behavior of making no request at all when
    // nothing needs mapping — without it, a contact whose logs are all untyped
    // would newly fail here if the lookup fetch failed.
    const typeById = new Map<number, string | null>();
    if (logs.some(log => log.Contact_Log_Type_ID)) {
      const types = await contactLogService.getContactLogTypes();
      for (const type of types) {
        typeById.set(type.Contact_Log_Type_ID, type.Contact_Log_Type || null);
      }
    }

    // Built field by field, never by spreading the row: whatever is returned
    // here is serialized to the browser, and the full MP row carries author
    // IDs (`Made_By`), the subject `Contact_ID` and cross-record links the UI
    // never renders. See `ContactLogDisplay`.
    return logs.map((log): ContactLogDisplay => ({
      Contact_Log_ID: log.Contact_Log_ID,
      Contact_Date: log.Contact_Date,
      Notes: log.Notes,
      Contact_Log_Type: log.Contact_Log_Type_ID
        ? typeById.get(log.Contact_Log_Type_ID) ?? null
        : null,
    }));
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch contact logs');
  }
}
