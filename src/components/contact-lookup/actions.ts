'use server';

import { ContactService } from '@/services/contactService';
import { ContactSearch } from '@/lib/dto';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function searchContacts(searchTerm: string): Promise<ContactSearch[]> {
  // Server actions compile to callable POST endpoints and src/proxy.ts lets all
  // /api paths through without a session, so this check is the only thing
  // standing between an anonymous caller and 20 contacts' emails and phones.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const contactService = await ContactService.getInstance();
    const results = await contactService.contactSearch(searchTerm.trim());

    return results;
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw new Error('Failed to search contacts');
  }
}
