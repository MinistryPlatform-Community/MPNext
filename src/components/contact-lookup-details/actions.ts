'use server';

import { ContactLookupDetails, ContactLogDisplay } from '@/lib/dto';
import { ContactService } from '@/services/contactService';
import { ContactLogService } from '@/services/contactLogService';

export async function getContactDetails(guid: string): Promise<ContactLookupDetails> {
  try {
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
    throw new Error('Failed to fetch contact details');
  }
}

export async function getContactLogsByContactId(contactId: number): Promise<ContactLogDisplay[]> {
  try {
    if (!contactId || contactId <= 0) {
      throw new Error('Valid contact ID is required');
    }

    const contactLogService = await ContactLogService.getInstance();
    const logs = await contactLogService.getContactLogsByContactId(contactId);
    
    // Transform to ContactLogDisplay with type information
    const logsWithTypes = await Promise.all(
      logs.map(async (log) => {
        let contactLogType: string | null = null;
        
        if (log.Contact_Log_Type_ID) {
          const types = await contactLogService.getContactLogTypes();
          const type = types.find(t => t.Contact_Log_Type_ID === log.Contact_Log_Type_ID);
          contactLogType = type?.Contact_Log_Type || null;
        }
        
        return {
          ...log,
          Contact_Log_Type: contactLogType,
        } as ContactLogDisplay;
      })
    );
    
    return logsWithTypes;
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    throw new Error('Failed to fetch contact logs');
  }
}