'use server';

import { ContactService } from '@/services/contactService';
import { ContactSearch } from '@/lib/providers/ministry-platform/models';

export async function searchContacts(searchTerm: string): Promise<ContactSearch[]> {
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