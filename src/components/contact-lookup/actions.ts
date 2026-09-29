'use server';

import { ContactService } from '@/services/contactService';
import { CONTACT_SEARCH_MAX_LENGTH, ContactSearch } from '@/lib/dto';
import { AuthorizationService } from '@/services/authorizationService';

export async function searchContacts(searchTerm: string): Promise<ContactSearch[]> {
  // Server actions compile to callable POST endpoints on page paths. src/proxy.ts
  // only checks that a session cookie is PRESENT (any value passes), so it
  // stops nobody who sets one; this gate is the real control standing between
  // a caller and 20 contacts' emails and phones.
  //
  // A session alone is NOT enough (F1, 2026-09-12): MP's OIDC endpoint
  // authenticates any dp_Users record, and this app reads MP with its own
  // client-credentials service account, so MP's per-user record security never
  // applies. The role gate — which implies an authenticated session — is what
  // decides. Kept outside the try below so UnauthorizedError reaches the caller
  // instead of being flattened into "Failed to search contacts".
  await AuthorizationService.getInstance().requireSecurityRole({
    table: 'Contacts',
    operation: 'read',
  });

  // Argument checks sit outside the try too, so the caller sees why the term
  // was refused rather than "Failed to search contacts". The declared `string`
  // is erased at runtime, and this payload is caller-shaped. Neither message
  // echoes the term.
  if (searchTerm !== undefined && searchTerm !== null && typeof searchTerm !== 'string') {
    throw new Error('Search term must be a string');
  }
  const term = (searchTerm ?? '').trim();
  if (term.length > CONTACT_SEARCH_MAX_LENGTH) {
    throw new Error(`Search term must be ${CONTACT_SEARCH_MAX_LENGTH} characters or fewer`);
  }

  try {
    if (term.length === 0) {
      return [];
    }

    const contactService = await ContactService.getInstance();
    const results = await contactService.contactSearch(term);

    return results;
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw new Error('Failed to search contacts');
  }
}
