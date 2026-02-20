'use server';

import { auth } from '@/auth';
import { ContactService } from '@/services/contactService';
import { ContactSearch } from '@/lib/dto';

export async function searchContacts(searchTerm: string): Promise<ContactSearch[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const contactService = await ContactService.getInstance(session.accessToken);
    const results = await contactService.contactSearch(searchTerm.trim());

    return results;
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw new Error('Failed to search contacts');
  }
}
