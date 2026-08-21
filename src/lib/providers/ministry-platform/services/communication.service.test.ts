import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommunicationService } from '@/lib/providers/ministry-platform/services/communication.service';
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
 */
describe('CommunicationService', () => {
  let communicationService: CommunicationService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

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

      const result = await communicationService.createCommunication(communicationInfo);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/communications', {
        ...communicationInfo,
      });
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
      expect(result).toEqual(createdCommunication);
    });

    it('should spread the payload rather than pass the caller object by reference', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.createCommunication(communicationInfo);

      const sent = (mockHttpClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(sent).toEqual(communicationInfo);
      expect(sent).not.toBe(communicationInfo);
    });

    it('should take the JSON path when attachments is an empty array', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.createCommunication(communicationInfo, []);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });

    it('should POST multipart form data when attachments are present', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdCommunication
      );

      const bulletin = new File(['bulletin'], 'bulletin.pdf', { type: 'application/pdf' });
      const flyer = new File(['flyer'], 'flyer.png', { type: 'image/png' });

      const result = await communicationService.createCommunication(communicationInfo, [
        bulletin,
        flyer,
      ]);

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
        communicationService.createCommunication(communicationInfo)
      ).rejects.toThrow('400 Bad Request');
    });

    it('should re-throw HTTP errors from the multipart path', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /communications failed: 413 Payload Too Large')
      );

      const big = new File(['x'], 'big.zip');

      await expect(
        communicationService.createCommunication(communicationInfo, [big])
      ).rejects.toThrow('413 Payload Too Large');
    });

    it('should not send anything when the token refresh fails', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(
        communicationService.createCommunication(communicationInfo)
      ).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should POST JSON to /messages when there are no attachments', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      const result = await communicationService.sendMessage(messageInfo);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/messages', { ...messageInfo });
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
      expect(result).toEqual(createdCommunication);
    });

    it('should take the JSON path when attachments is an empty array', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdCommunication);

      await communicationService.sendMessage(messageInfo, []);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });

    it('should POST multipart form data under the message key when attachments are present', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdCommunication
      );

      const receipt = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' });

      await communicationService.sendMessage(messageInfo, [receipt]);

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

      await expect(communicationService.sendMessage(messageInfo)).rejects.toThrow(
        '422 Unprocessable Entity'
      );
    });

    it('should re-throw HTTP errors from the multipart path', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /messages failed: 500 Internal Server Error')
      );

      await expect(
        communicationService.sendMessage(messageInfo, [new File(['x'], 'x.txt')])
      ).rejects.toThrow('500 Internal Server Error');
    });

    it('should not send anything when the token refresh fails', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(communicationService.sendMessage(messageInfo)).rejects.toThrow(
        'Token refresh failed'
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });
  });
});
