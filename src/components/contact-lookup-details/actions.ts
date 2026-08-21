'use server';

import { ContactLookupDetails, ContactLogDisplay } from '@/lib/dto';
import { ContactService } from '@/services/contactService';
import { ContactLogService } from '@/services/contactLogService';
import { sanitizeNumericId } from '@/lib/providers/ministry-platform/utils/filter-sanitize';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getContactDetails(guid: string): Promise<ContactLookupDetails> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

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

    return logs.map(log => ({
      ...log,
      Contact_Log_Type: log.Contact_Log_Type_ID
        ? typeById.get(log.Contact_Log_Type_ID) ?? null
        : null,
    })) as ContactLogDisplay[];
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch contact logs');
  }
}
