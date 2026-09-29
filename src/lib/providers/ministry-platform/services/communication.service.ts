import { MinistryPlatformClient } from "../client";
import {
    COMMUNICATION_TYPES,
    CommunicationInfo,
    CommunicationType,
    Communication,
    MessageAddress,
    MessageInfo,
} from "../types";
import { sanitizeNumericId } from "../utils/filter-sanitize";
import { errorName } from "./guards";

/**
 * Who a communication is authored by and sent from.
 *
 * This layer has no authorization gate of its own, and the service account can
 * send as anyone, so the sender is a separate argument that callers must build
 * from trusted server state — the acting user's `User_ID` from the
 * authorization gate / SessionContextService, and a contact that user may send
 * as — never from request input. Whatever author/from values the payload
 * carries are ignored and replaced with these.
 */
export interface CommunicationSender {
    /** `dp_Users.User_ID` of the acting user. */
    authorUserId: number;
    /** `Contacts.Contact_ID` the communication is sent from. */
    fromContactId: number;
}

/**
 * The From address for {@link CommunicationService.sendMessage}, built from
 * trusted server state (the acting user's own address, or a configured
 * organisation address) — never from request input. Any `FromAddress` on the
 * message itself is ignored and replaced with this.
 */
export interface MessageSender {
    fromAddress: MessageAddress;
}

/** The `CommunicationType` values that may be sent; see `COMMUNICATION_TYPES`. */
const ALLOWED_COMMUNICATION_TYPES: ReadonlySet<string> = new Set(COMMUNICATION_TYPES);

/** C0 controls and DEL: CR/LF in a subject or display name is header injection. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/** One plain address: no display-name syntax, lists, comments or whitespace. */
const EMAIL_ADDRESS = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]+$/;

const MAX_EMAIL_LENGTH = 254;
const MAX_DISPLAY_NAME_LENGTH = 256;

/*
 * Validation helpers. Each throws a fixed message naming the field, never the
 * value, so nothing caller-supplied (or member data) reaches an error or log.
 */
function invalid(field: string): Error {
    return new Error(`Invalid ${field}`);
}

function requireString(value: unknown, field: string): string {
    if (typeof value !== 'string') throw invalid(field);
    return value;
}

function requireHeaderText(value: unknown, field: string): string {
    const text = requireString(value, field);
    if (CONTROL_CHARS.test(text)) throw invalid(field);
    return text;
}

function requireBoolean(value: unknown, field: string): boolean {
    if (typeof value !== 'boolean') throw invalid(field);
    return value;
}

function requireIdList(value: unknown, field: string): number[] {
    if (!Array.isArray(value) || value.length === 0) throw invalid(field);
    return value.map((id) => sanitizeNumericId(id, field));
}

function requireAddress(value: unknown, field: string): MessageAddress {
    if (typeof value !== 'object' || value === null) throw invalid(field);
    const { DisplayName, Address } = value as Record<string, unknown>;
    const displayName = requireHeaderText(DisplayName, field);
    const address = requireString(Address, field);
    if (
        displayName.length > MAX_DISPLAY_NAME_LENGTH ||
        address.length > MAX_EMAIL_LENGTH ||
        !EMAIL_ADDRESS.test(address)
    ) {
        throw invalid(field);
    }
    return { DisplayName: displayName, Address: address };
}

/**
 * Rebuilds the payload from the known CommunicationInfo keys only, so a caller
 * cannot smuggle extra fields (`Author_User_ID`, `$userId`, ...) through to MP,
 * and stamps author/from from the trusted sender.
 */
function buildCommunication(communication: unknown, sender: unknown): CommunicationInfo {
    if (typeof sender !== 'object' || sender === null) {
        throw new Error('A trusted sender is required');
    }
    if (typeof communication !== 'object' || communication === null) {
        throw invalid('communication');
    }
    const { authorUserId, fromContactId } = sender as Record<string, unknown>;
    const c = communication as Record<string, unknown>;

    if (typeof c.CommunicationType !== 'string' || !ALLOWED_COMMUNICATION_TYPES.has(c.CommunicationType)) {
        throw invalid('CommunicationType');
    }

    const fields = {
        AuthorUserId: sanitizeNumericId(authorUserId, 'sender authorUserId'),
        Body: requireString(c.Body, 'Body'),
        FromContactId: sanitizeNumericId(fromContactId, 'sender fromContactId'),
        ReplyToContactId: sanitizeNumericId(c.ReplyToContactId, 'ReplyToContactId'),
        Contacts: requireIdList(c.Contacts, 'Contacts'),
        IsBulkEmail: requireBoolean(c.IsBulkEmail, 'IsBulkEmail'),
        SendToContactParents: requireBoolean(c.SendToContactParents, 'SendToContactParents'),
        Subject: requireHeaderText(c.Subject, 'Subject'),
        StartDate: requireString(c.StartDate, 'StartDate'),
    };

    // MP's Swagger marks TextPhoneNumberId optional, but an SMS send without it
    // fails with an opaque 500 ("required and must be populated").
    if (c.CommunicationType === 'SMS') {
        return {
            ...fields,
            CommunicationType: 'SMS',
            TextPhoneNumberId: sanitizeNumericId(c.TextPhoneNumberId, 'TextPhoneNumberId'),
        };
    }

    const payload: CommunicationInfo = {
        ...fields,
        CommunicationType: c.CommunicationType as Exclude<CommunicationType, 'SMS'>,
    };
    if (c.TextPhoneNumberId !== undefined) {
        payload.TextPhoneNumberId = sanitizeNumericId(c.TextPhoneNumberId, 'TextPhoneNumberId');
    }
    return payload;
}

/** As {@link buildCommunication}, for MessageInfo; FromAddress comes from the sender. */
function buildMessage(message: unknown, sender: unknown): MessageInfo {
    if (typeof sender !== 'object' || sender === null) {
        throw new Error('A trusted sender is required');
    }
    if (typeof message !== 'object' || message === null) {
        throw invalid('message');
    }
    const m = message as Record<string, unknown>;

    if (!Array.isArray(m.ToAddresses) || m.ToAddresses.length === 0) {
        throw invalid('ToAddresses');
    }

    const payload: MessageInfo = {
        FromAddress: requireAddress((sender as Record<string, unknown>).fromAddress, 'sender fromAddress'),
        ToAddresses: m.ToAddresses.map((to) => requireAddress(to, 'ToAddresses')),
        Subject: requireHeaderText(m.Subject, 'Subject'),
        Body: requireString(m.Body, 'Body'),
    };
    if (m.ReplyToAddress !== undefined) {
        payload.ReplyToAddress = requireAddress(m.ReplyToAddress, 'ReplyToAddress');
    }
    if (m.StartDate !== undefined) {
        payload.StartDate = requireString(m.StartDate, 'StartDate');
    }
    return payload;
}

export class CommunicationService {
    private client: MinistryPlatformClient;

    constructor(client: MinistryPlatformClient) {
        this.client = client;
    }

    /**
     * Creates a new communication, immediately renders it and schedules for delivery.
     *
     * `sender` is required: without it the call is refused before anything is
     * sent. It is optional in the signature only so the existing two-argument
     * provider passthrough still compiles; that passthrough therefore fails
     * closed until it forwards a trusted sender.
     */
    public async createCommunication(
        communication: CommunicationInfo,
        attachments?: File[],
        sender?: CommunicationSender
    ): Promise<Communication> {
        const payload = buildCommunication(communication, sender);
        try {
            await this.client.ensureValidToken();

            if (attachments && attachments.length > 0) {
                return await this.createCommunicationWithAttachments(payload, attachments);
            } else {
                return await this.client.getHttpClient().post<Communication>('/communications', { ...payload });
            }
        } catch (error) {
            console.error('Error creating communication:', errorName(error));
            throw error;
        }
    }
    /**
     * Creates email messages from the provided information and immediately schedules them for delivery.
     *
     * `sender` is required, as for {@link createCommunication}; the message's
     * own `FromAddress` is ignored.
     */
    public async sendMessage(
        message: MessageInfo,
        attachments?: File[],
        sender?: MessageSender
    ): Promise<Communication> {
        const payload = buildMessage(message, sender);
        try {
            await this.client.ensureValidToken();

            if (attachments && attachments.length > 0) {
                return await this.sendMessageWithAttachments(payload, attachments);
            } else {
                return await this.client.getHttpClient().post<Communication>('/messages', { ...payload });
            }
        } catch (error) {
            console.error('Error sending message:', errorName(error));
            throw error;
        }
    }

    private async createCommunicationWithAttachments(
        communication: CommunicationInfo,
        attachments: File[]
    ): Promise<Communication> {
        const formData = new FormData();
        formData.append('communication', JSON.stringify(communication));

        attachments.forEach((file, index) => {
            formData.append(`file-${index}`, file, file.name);
        });

        return await this.client.getHttpClient().postFormData<Communication>('/communications', formData);
    }

    private async sendMessageWithAttachments(
        message: MessageInfo,
        attachments: File[]
    ): Promise<Communication> {
        const formData = new FormData();
        formData.append('message', JSON.stringify(message));

        attachments.forEach((file, index) => {
            formData.append(`file-${index}`, file, file.name);
        });

        return await this.client.getHttpClient().postFormData<Communication>('/messages', formData);
    }
}
