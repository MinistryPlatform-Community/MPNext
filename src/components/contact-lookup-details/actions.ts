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

type ContactUpdatableFields = Partial<Pick<ContactLookupDetails, "Email_Address" | "Mobile_Phone">>;

export async function updateContactEmailMobile(input: {
  contactId: number;
  Email_Address?: string | null;
  Mobile_Phone?: string | null;
}): Promise<{ ok: true }> {
  try {
    if (!input.contactId) {
      throw new Error("contactId is required");
    }

    const Email_Address = input.Email_Address?.trim() || null;
    const Mobile_Phone = input.Mobile_Phone?.trim() || null;

    if (Email_Address && !/^\S+@\S+\.\S+$/.test(Email_Address)) {
      throw new Error("Invalid email address");
    }

    const contactService = await ContactService.getInstance();
    const fields: ContactUpdatableFields = {};
    
    if (Email_Address !== undefined && Email_Address !== null) fields.Email_Address = Email_Address;
    if (Mobile_Phone !== undefined && Mobile_Phone !== null) fields.Mobile_Phone = Mobile_Phone;

    await contactService.updateContact(input.contactId, fields);
    return { ok: true };
  } catch (error) {
    console.error("Error updating contact:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update contact");
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