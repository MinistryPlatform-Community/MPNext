import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  CommunicationContent,
  MessageContent,
} from '@/lib/providers/ministry-platform/types';

/**
 * MPHelper -> MinistryPlatformProvider -> real services, wired end to end.
 *
 * helper.test.ts and provider.test.ts each mock the layer below, so neither
 * can show that the trusted sender and the procedure allowlist actually reach
 * CommunicationService / ProcedureService. Here only the HTTP client is
 * mocked: nothing reaches Ministry Platform.
 */

const { mockGet, mockPost, mockPostFormData } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPostFormData: vi.fn(),
}));

vi.mock('@/lib/providers/ministry-platform/client', () => ({
  MinistryPlatformClient: class {
    ensureValidToken = vi.fn().mockResolvedValue(undefined);
    getHttpClient = () => ({ get: mockGet, post: mockPost, postFormData: mockPostFormData });
  },
}));

import { MPHelper } from '@/lib/providers/ministry-platform/helper';
import { MinistryPlatformProvider } from '@/lib/providers/ministry-platform/provider';

describe('MPHelper wiring (real provider and services, mocked HTTP)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MinistryPlatformProvider as any).instance = undefined;
    mockPost.mockResolvedValue({ Communication_ID: 1 });
    mockGet.mockResolvedValue([[]]);
  });

  describe('trusted sender', () => {
    const content = {
      Subject: 'Sunday update',
      Body: '<p>Hello</p>',
      StartDate: '2026-10-04T09:00:00',
      ReplyToContactId: 70,
      CommunicationType: 'Email',
      Contacts: [456],
      IsBulkEmail: false,
      SendToContactParents: false,
    } satisfies CommunicationContent;

    it('should stamp author/from from the sender, ignoring spoofed payload fields', async () => {
      const spoofed = { ...content, AuthorUserId: 1, FromContactId: 2 };

      await new MPHelper().createCommunication(spoofed, { authorUserId: 7, fromContactId: 70 });

      expect(mockPost).toHaveBeenCalledTimes(1);
      const [path, body] = mockPost.mock.calls[0];
      expect(path).toBe('/communications');
      expect(body).toMatchObject({ AuthorUserId: 7, FromContactId: 70 });
    });

    it('should use the sender From address for sendMessage, ignoring a payload FromAddress', async () => {
      const message = {
        ToAddresses: [{ DisplayName: 'Member', Address: 'member@example.org' }],
        Subject: 'Welcome',
        Body: '<p>Hi</p>',
        FromAddress: { DisplayName: 'Spoof', Address: 'pastor@example.org' },
      } as MessageContent;

      await new MPHelper().sendMessage(message, {
        fromAddress: { DisplayName: 'Church Office', Address: 'office@example.org' },
      });

      const [path, body] = mockPost.mock.calls[0];
      expect(path).toBe('/messages');
      expect(body.FromAddress).toEqual({ DisplayName: 'Church Office', Address: 'office@example.org' });
    });

    it('should refuse a JavaScript caller that omits the sender, before any request', async () => {
      const helper = new MPHelper();
      const untyped = helper as unknown as {
        createCommunication: (c: unknown) => Promise<unknown>;
        sendMessage: (m: unknown) => Promise<unknown>;
      };

      await expect(untyped.createCommunication(content)).rejects.toThrow(
        'A trusted sender is required'
      );
      await expect(
        untyped.sendMessage({ ToAddresses: [], Subject: 'x', Body: 'x' })
      ).rejects.toThrow('A trusted sender is required');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should refuse the old (content, attachments) call shape, before any request', async () => {
      const helper = new MPHelper() as unknown as {
        createCommunication: (c: unknown, a: unknown) => Promise<unknown>;
      };

      await expect(
        helper.createCommunication(content, [new File(['x'], 'x.pdf')])
      ).rejects.toThrow('Invalid sender authorUserId');
      expect(mockPost).not.toHaveBeenCalled();
      expect(mockPostFormData).not.toHaveBeenCalled();
    });
  });

  describe('procedure allowlist', () => {
    it('should refuse every procedure by default', async () => {
      const helper = new MPHelper();

      await expect(helper.executeProcedure('api_Fork_Get_Stats')).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
      await expect(helper.executeProcedureWithBody('api_Fork_Get_Stats', {})).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
      expect(mockGet).not.toHaveBeenCalled();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should run a procedure on the instance allowlist, and only that one', async () => {
      const helper = new MPHelper({ allowedProcedures: ['api_Fork_Get_Stats'] });

      await helper.executeProcedure('api_Fork_Get_Stats', { '@Id': 1 });
      await helper.executeProcedureWithBody('api_Fork_Get_Stats', { '@Id': 1 });

      expect(mockGet).toHaveBeenCalledWith('/procs/api_Fork_Get_Stats', { '@Id': 1 });
      expect(mockPost).toHaveBeenCalledWith('/procs/api_Fork_Get_Stats', { '@Id': 1 });

      await expect(helper.executeProcedure('api_Delete_Everything')).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
      await expect(helper.executeProcedure('API_FORK_GET_STATS')).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
    });

    it('should not extend another helper instance', async () => {
      new MPHelper({ allowedProcedures: ['api_Fork_Get_Stats'] });

      await expect(new MPHelper().executeProcedure('api_Fork_Get_Stats')).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  it('should never forward $ignorePermissions to the global filters endpoint', async () => {
    mockGet.mockResolvedValueOnce([]);

    await new MPHelper().getGlobalFilters({
      $ignorePermissions: true,
      $userId: 42,
    } as unknown as { $userId: number });

    expect(mockGet).toHaveBeenCalledWith('/domain/filters', { $userId: 42 });
  });
});
