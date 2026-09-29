import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CommunicationService,
  type CommunicationSender,
  type MessageSender,
} from '@/lib/providers/ministry-platform/services/communication.service';
import type { MinistryPlatformClient } from '@/lib/providers/ministry-platform/client';
import type { HttpClient } from '@/lib/providers/ministry-platform/utils/http-client';
import type {
  Communication,
  CommunicationInfo,
  MessageInfo,
} from '@/lib/providers/ministry-platform/types';

/**
 * CommunicationService Tests
 *
 * Covers:
 * - createCommunication -> POST /communications (JSON) or postFormData (attachments)
 * - sendMessage         -> POST /messages      (JSON) or postFormData (attachments)
 *
 * This service sends real email and SMS to real church members in production, so
 * every test here drives a fully mocked HttpClient. Nothing in this file makes a
 * network call, and no MP instance is contacted.
 *
 * The branch that matters most is `attachments && attachments.length > 0`: an
 * empty array must take the plain-JSON path, not the multipart one, because the
 * two hit different MP endpoints with different payload shapes.
 *
 * Author/from come only from the separate trusted `sender` argument: a call
 * without one is refused, and author/from values (or any unknown keys) on the
 * payload itself are overwritten or dropped. See "trusted sender" below.
 */
describe('CommunicationService', () => {
  let communicationService: CommunicationService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

  const commSender: CommunicationSender = { authorUserId: 7, fromContactId: 100 };
  const msgSender: MessageSender = {
    fromAddress: { DisplayName: 'Church Office', Address: 'office@example.org' },
  };

  const communicationInfo: CommunicationInfo = {
    AuthorUserId: 7,
    Body: 'Service is cancelled this Sunday.',
    FromContactId: 100,
    ReplyToContactId: 100,
    CommunicationType: 'Email',
    Contacts: [1, 2, 3],
    IsBulkEmail: true,
    SendToContactParents: false,
    Subject: 'Sunday update',
    StartDate: '2026-08-21T09:00:00',
  };

  const messageInfo: MessageInfo = {
    FromAddress: { DisplayName: 'Church Office', Address: 'office@example.org' },
    ToAddresses: [{ DisplayName: 'John Doe', Address: 'john@example.com' }],
    Subject: 'Welcome',
    Body: 'Glad to have you.',
  };

  const createdCommunication: Communication = {
    Communication_ID: 555,
    Author_User_ID: 7,
    Subject: 'Sunday update',
    Body: 'Service is cancelled this Sunday.',
    Domain_ID: 1,
    Start_Date: '2026-08-21T09:00:00',
    Communication_Status_ID: 1,
    From_Contact: 100,
    Reply_to_Contact: 100,
    Active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      buildUrl: vi.fn(),
      postFormData: vi.fn(),
      putFormData: vi.fn(),
    } as unknown as HttpClient;

    mockClient = {
      ensureValidToken: vi.fn().mockResolvedValue(undefined),
      getHttpClient: vi.fn().mockReturnValue(mockHttpClient),
    } as unknown as MinistryPlatformClient;

    communicationService = new CommunicationService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCommunication', () => {
    it('should POST JSON to /communications when there are no attachments', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      const result = await communicationService.createCommunication(communicationInfo, undefined, commSender);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/communications', {
        ...communicationInfo,
      });
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
      expect(result).toEqual(createdCommunication);
    });

    it('should spread the payload rather than pass the caller object by reference', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.createCommunication(communicationInfo, undefined, commSender);

      const sent = (mockHttpClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(sent).toEqual(communicationInfo);
      expect(sent).not.toBe(communicationInfo);
    });

    it('should take the JSON path when attachments is an empty array', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.createCommunication(communicationInfo, [], commSender);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });

    it('should POST multipart form data when attachments are present', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdCommunication
      );

      const bulletin = new File(['bulletin'], 'bulletin.pdf', { type: 'application/pdf' });
      const flyer = new File(['flyer'], 'flyer.png', { type: 'image/png' });

      const result = await communicationService.createCommunication(
        communicationInfo,
        [bulletin, flyer],
        commSender
      );

      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockHttpClient.postFormData).toHaveBeenCalledTimes(1);

      const [endpoint, formData] = (
        mockHttpClient.postFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(endpoint).toBe('/communications');
      expect(formData).toBeInstanceOf(FormData);
      expect(JSON.parse(formData.get('communication') as string)).toEqual(communicationInfo);
      expect((formData.get('file-0') as File).name).toBe('bulletin.pdf');
      expect((formData.get('file-1') as File).name).toBe('flyer.png');
      expect(result).toEqual(createdCommunication);
    });

    it('should re-throw HTTP errors from the JSON path', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /communications failed: 400 Bad Request')
      );

      await expect(
        communicationService.createCommunication(communicationInfo, undefined, commSender)
      ).rejects.toThrow('400 Bad Request');
    });

    it('should re-throw HTTP errors from the multipart path', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /communications failed: 413 Payload Too Large')
      );

      const big = new File(['x'], 'big.zip');

      await expect(
        communicationService.createCommunication(communicationInfo, [big], commSender)
      ).rejects.toThrow('413 Payload Too Large');
    });

    it('should not send anything when the token refresh fails', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(
        communicationService.createCommunication(communicationInfo, undefined, commSender)
      ).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should POST JSON to /messages when there are no attachments', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      const result = await communicationService.sendMessage(messageInfo, undefined, msgSender);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/messages', { ...messageInfo });
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
      expect(result).toEqual(createdCommunication);
    });

    it('should take the JSON path when attachments is an empty array', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.sendMessage(messageInfo, [], msgSender);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });

    it('should POST multipart form data under the message key when attachments are present', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdCommunication
      );

      const receipt = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' });

      await communicationService.sendMessage(messageInfo, [receipt], msgSender);

      const [endpoint, formData] = (
        mockHttpClient.postFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(endpoint).toBe('/messages');
      expect(JSON.parse(formData.get('message') as string)).toEqual(messageInfo);
      expect((formData.get('file-0') as File).name).toBe('receipt.pdf');
    });

    it('should re-throw HTTP errors from the JSON path', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /messages failed: 422 Unprocessable Entity')
      );

      await expect(communicationService.sendMessage(messageInfo, undefined, msgSender)).rejects.toThrow(
        '422 Unprocessable Entity'
      );
    });

    it('should re-throw HTTP errors from the multipart path', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /messages failed: 500 Internal Server Error')
      );

      await expect(
        communicationService.sendMessage(messageInfo, [new File(['x'], 'x.txt')], msgSender)
      ).rejects.toThrow('500 Internal Server Error');
    });

    it('should not send anything when the token refresh fails', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(communicationService.sendMessage(messageInfo, undefined, msgSender)).rejects.toThrow(
        'Token refresh failed'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });
  });

  describe('trusted sender', () => {
    function expectNothingSent() {
      expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    }

    function sentCommunication(): Record<string, unknown> {
      return (mockHttpClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1];
    }

    it('should refuse createCommunication without a sender (the two-argument provider path)', async () => {
      await expect(communicationService.createCommunication(communicationInfo)).rejects.toThrow(
        'A trusted sender is required'
      );
      await expect(
        communicationService.createCommunication(communicationInfo, [new File(['x'], 'x.pdf')])
      ).rejects.toThrow('A trusted sender is required');
      expectNothingSent();
    });

    it('should refuse sendMessage without a sender', async () => {
      await expect(communicationService.sendMessage(messageInfo)).rejects.toThrow(
        'A trusted sender is required'
      );
      expectNothingSent();
    });

    it('should overwrite smuggled AuthorUserId / FromContactId with the sender', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.createCommunication(
        { ...communicationInfo, AuthorUserId: 1, FromContactId: 2 },
        undefined,
        { authorUserId: 7, fromContactId: 100 }
      );

      expect(sentCommunication()).toMatchObject({ AuthorUserId: 7, FromContactId: 100 });
    });

    it('should overwrite a smuggled FromAddress with the sender, on both paths', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdCommunication
      );
      const spoofed: MessageInfo = {
        ...messageInfo,
        FromAddress: { DisplayName: 'Senior Pastor', Address: 'pastor@example.org' },
      };

      await communicationService.sendMessage(spoofed, undefined, msgSender);
      await communicationService.sendMessage(spoofed, [new File(['x'], 'x.pdf')], msgSender);

      expect(sentCommunication().FromAddress).toEqual(msgSender.fromAddress);
      const formData = (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(JSON.parse(formData.get('message') as string).FromAddress).toEqual(
        msgSender.fromAddress
      );
    });

    it('should drop fields that are not part of CommunicationInfo', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.createCommunication(
        {
          ...communicationInfo,
          Author_User_ID: 1,
          From_Contact: 2,
          $userId: 3,
          TextPhoneNumberId: 9,
        } as unknown as CommunicationInfo,
        undefined,
        commSender
      );

      expect(sentCommunication()).toEqual({ ...communicationInfo, TextPhoneNumberId: 9 });
    });

    it('should drop fields that are not part of MessageInfo, and keep the optional ones', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);
      const replyTo = { DisplayName: 'Office', Address: 'reply@example.org' };

      await communicationService.sendMessage(
        {
          ...messageInfo,
          ReplyToAddress: replyTo,
          StartDate: '2026-08-21T09:00:00',
          BccAddresses: [{ DisplayName: 'x', Address: 'x@evil.example' }],
        } as unknown as MessageInfo,
        undefined,
        msgSender
      );

      expect(sentCommunication()).toEqual({
        ...messageInfo,
        ReplyToAddress: replyTo,
        StartDate: '2026-08-21T09:00:00',
      });
    });

    it.each([
      ['authorUserId', { authorUserId: 0, fromContactId: 100 }, 'Invalid sender authorUserId'],
      ['authorUserId', { authorUserId: '7; x', fromContactId: 100 }, 'Invalid sender authorUserId'],
      ['fromContactId', { authorUserId: 7 }, 'Invalid sender fromContactId'],
      ['sender', null, 'A trusted sender is required'],
    ])('should refuse an invalid communication sender (%s)', async (_label, sender, message) => {
      await expect(
        communicationService.createCommunication(
          communicationInfo,
          undefined,
          sender as unknown as CommunicationSender
        )
      ).rejects.toThrow(message);
      expectNothingSent();
    });

    it.each([
      ['missing', {}],
      ['CRLF in display name', { fromAddress: { DisplayName: 'Office\r\nBcc: x@evil.example', Address: 'office@example.org' } }],
      ['address list', { fromAddress: { DisplayName: 'Office', Address: 'a@example.org,b@example.org' } }],
      ['display-name syntax', { fromAddress: { DisplayName: 'Office', Address: 'Office <a@example.org>' } }],
      ['no domain', { fromAddress: { DisplayName: 'Office', Address: 'office@' } }],
      ['too long', { fromAddress: { DisplayName: 'Office', Address: `${'a'.repeat(250)}@example.org` } }],
      ['long name', { fromAddress: { DisplayName: 'x'.repeat(257), Address: 'office@example.org' } }],
      ['non-string', { fromAddress: { DisplayName: 'Office', Address: 42 } }],
    ])('should refuse an invalid message sender (%s)', async (_label, sender) => {
      await expect(
        communicationService.sendMessage(messageInfo, undefined, sender as unknown as MessageSender)
      ).rejects.toThrow('Invalid sender fromAddress');
      expectNothingSent();
    });
  });

  describe('payload validation', () => {
    function expectNothingSent() {
      expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    }

    it.each([
      ['Subject', { Subject: 'Hi\r\nBcc: x@evil.example' }],
      ['Subject', { Subject: 42 }],
      ['Body', { Body: undefined }],
      ['StartDate', { StartDate: 20260821 }],
      ['CommunicationType', { CommunicationType: 'Fax' }],
      ['CommunicationType', { CommunicationType: undefined }],
      ['Contacts', { Contacts: [] }],
      ['Contacts', { Contacts: 'all' }],
      ['Contacts', { Contacts: [1, '2 OR 1=1'] }],
      ['ReplyToContactId', { ReplyToContactId: -5 }],
      ['IsBulkEmail', { IsBulkEmail: 'true' }],
      ['SendToContactParents', { SendToContactParents: 1 }],
      ['TextPhoneNumberId', { TextPhoneNumberId: 'x' }],
    ])('should refuse an invalid communication %s', async (field, override) => {
      await expect(
        communicationService.createCommunication(
          { ...communicationInfo, ...override } as unknown as CommunicationInfo,
          undefined,
          commSender
        )
      ).rejects.toThrow(`Invalid ${field}`);
      expectNothingSent();
    });

    it('should refuse a non-object communication', async () => {
      await expect(
        communicationService.createCommunication(
          null as unknown as CommunicationInfo,
          undefined,
          commSender
        )
      ).rejects.toThrow('Invalid communication');
      expectNothingSent();
    });

    it.each([
      ['ToAddresses', { ToAddresses: [] }],
      ['ToAddresses', { ToAddresses: 'john@example.com' }],
      ['ToAddresses', { ToAddresses: [{ DisplayName: 'J', Address: 'john@example.com\r\n' }] }],
      ['ToAddresses', { ToAddresses: [null] }],
      ['ReplyToAddress', { ReplyToAddress: { DisplayName: 'R', Address: 'not-an-address' } }],
      ['Subject', { Subject: 'Hi\nthere' }],
      ['Body', { Body: {} }],
      ['StartDate', { StartDate: false }],
    ])('should refuse an invalid message %s', async (field, override) => {
      await expect(
        communicationService.sendMessage(
          { ...messageInfo, ...override } as unknown as MessageInfo,
          undefined,
          msgSender
        )
      ).rejects.toThrow(`Invalid ${field}`);
      expectNothingSent();
    });

    it('should refuse a non-object message', async () => {
      await expect(
        communicationService.sendMessage('hi' as unknown as MessageInfo, undefined, msgSender)
      ).rejects.toThrow('Invalid message');
      expectNothingSent();
    });

    it('should not echo refused values in the error or the log', async () => {
      const error = await communicationService
        .sendMessage(
          { ...messageInfo, Subject: 'Pastoral note about Jane\r\n' },
          undefined,
          msgSender
        )
        .catch((e: Error) => e);

      expect((error as Error).message).toBe('Invalid Subject');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log only the error name when MP rejects the send', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new SyntaxError('"Jane Doe" is not valid JSON')
      );

      await expect(
        communicationService.sendMessage(messageInfo, undefined, msgSender)
      ).rejects.toThrow(SyntaxError);
      expect(console.error).toHaveBeenCalledWith('Error sending message:', 'SyntaxError');
    });
  });
});
