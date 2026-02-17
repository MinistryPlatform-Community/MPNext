import { MPHelper } from '@/lib/providers/ministry-platform';
import {
  VolunteerInfo,
  VolunteerCard,
  VolunteerDetail,
  ChecklistItemStatus,
  BackgroundCheckDetail,
  CertificationDetail,
  FormResponseDetail,
  MilestoneDetail,
  WriteBackConfig
} from '@/lib/dto';

// Environment variable helpers
function getEnvIds(key: string): number[] {
  const val = process.env[key];
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
}

function getEnvId(key: string): number | null {
  const val = process.env[key];
  if (!val) return null;
  const num = Number(val.trim());
  return isNaN(num) ? null : num;
}

// Batch size for IN clause queries to avoid URL length limits
const BATCH_SIZE = 100;

// Expiration status helper
const EXPIRING_SOON_DAYS = 30;

function getExpirationStatus(
  completed: boolean,
  expiresDateStr: string | null
): 'complete' | 'expired' | 'expiring_soon' {
  if (!expiresDateStr) return 'complete';
  const expires = new Date(expiresDateStr);
  const now = new Date();
  if (expires < now) return 'expired';
  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + EXPIRING_SOON_DAYS);
  if (expires < soonDate) return 'expiring_soon';
  return completed ? 'complete' : 'complete';
}

// Raw record types from MP queries
interface GroupParticipantRecord {
  Group_Participant_ID: number;
  Participant_ID: number;
  Group_ID: number;
  Group_Role_ID: number;
  Start_Date: string;
  End_Date: string | null;
}

interface ContactRecord {
  Contact_ID: number;
  Participant_ID: number;
  First_Name: string;
  Nickname: string | null;
  Last_Name: string;
  Image_GUID: string | null;
}

interface FormResponseRecord {
  Form_Response_ID: number;
  Form_ID: number;
  Contact_ID: number;
  Response_Date: string;
  Expires: string | null;
}

interface MilestoneRecord {
  Participant_Milestone_ID: number;
  Participant_ID: number;
  Milestone_ID: number;
  Date_Accomplished: string | null;
  Notes: string | null;
}

interface BackgroundCheckRecord {
  Background_Check_ID: number;
  Contact_ID: number;
  Background_Check_Status_ID: number | null;
  Background_Check_Started: string;
  Background_Check_Submitted: string | null;
  Background_Check_Returned: string | null;
  All_Clear: boolean | null;
  Background_Check_Expires: string | null;
  Report_Url: string | null;
}

interface BackgroundCheckStatusRecord {
  Background_Check_Status_ID: number;
  Background_Check_Status: string;
}

interface CertificationRecord {
  Participant_Certification_ID: number;
  Participant_ID: number;
  Certification_Type_ID: number;
  Certification_Submitted: string;
  Certification_Completed: string | null;
  Certification_Expires: string | null;
  Passed: boolean | null;
}

interface ParticipantRecord {
  Participant_ID: number;
  Contact_ID: number;
}

export class VolunteerService {
  private static instance: VolunteerService;
  private mp: MPHelper | null = null;
  private bgStatusCache: Map<number, string> | null = null;

  private constructor() {
    this.initialize();
  }

  public static async getInstance(): Promise<VolunteerService> {
    if (!VolunteerService.instance) {
      VolunteerService.instance = new VolunteerService();
      await VolunteerService.instance.initialize();
    }
    return VolunteerService.instance;
  }

  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  // ---------------------------------------------------------------
  // Background Check Statuses (cached lookup)
  // ---------------------------------------------------------------

  private async getBackgroundCheckStatuses(): Promise<Map<number, string>> {
    if (this.bgStatusCache) return this.bgStatusCache;

    const statuses = await this.mp!.getTableRecords<BackgroundCheckStatusRecord>({
      table: 'Background_Check_Statuses',
      select: 'Background_Check_Status_ID,Background_Check_Status'
    });

    this.bgStatusCache = new Map(
      statuses.map(s => [s.Background_Check_Status_ID, s.Background_Check_Status])
    );
    return this.bgStatusCache;
  }

  // ---------------------------------------------------------------
  // Tab 1: In-Process Volunteers
  // ---------------------------------------------------------------

  public async getInProcessVolunteers(): Promise<VolunteerCard[]> {
    const groupIds = getEnvIds('VOLUNTEER_PROCESSING_GROUP_IDS');
    if (groupIds.length === 0) {
      console.warn('VOLUNTEER_PROCESSING_GROUP_IDS not configured');
      return [];
    }

    const now = new Date().toISOString();

    // Get active group participants in the processing group(s)
    const groupParticipants = await this.mp!.getTableRecords<GroupParticipantRecord>({
      table: 'Group_Participants',
      select: 'Group_Participant_ID,Participant_ID,Group_ID,Group_Role_ID,Start_Date,End_Date',
      filter: `Group_ID IN (${groupIds.join(',')}) AND (End_Date IS NULL OR End_Date >= '${now}')`
    });

    if (groupParticipants.length === 0) return [];

    // Get participant → contact mapping
    const participantIds = [...new Set(groupParticipants.map(gp => gp.Participant_ID))];
    const contacts = await this.getContactsForParticipants(participantIds);

    // Build volunteer info list
    const volunteers = this.buildVolunteerInfoList(groupParticipants, contacts);
    if (volunteers.length === 0) return [];

    // Fetch and assemble checklists
    return this.assembleVolunteerCards(volunteers);
  }

  // ---------------------------------------------------------------
  // Tab 2: Approved Volunteers
  // ---------------------------------------------------------------

  public async getApprovedVolunteers(): Promise<VolunteerCard[]> {
    const approvedRoleIds = getEnvIds('VOLUNTEER_APPROVED_GROUP_ROLE_IDS');
    if (approvedRoleIds.length === 0) {
      console.warn('VOLUNTEER_APPROVED_GROUP_ROLE_IDS not configured');
      return [];
    }

    const now = new Date().toISOString();

    // Get participants with approved roles (across all groups)
    const groupParticipants = await this.mp!.getTableRecords<GroupParticipantRecord>({
      table: 'Group_Participants',
      select: 'Group_Participant_ID,Participant_ID,Group_ID,Group_Role_ID,Start_Date,End_Date',
      filter: `Group_Role_ID IN (${approvedRoleIds.join(',')}) AND (End_Date IS NULL OR End_Date >= '${now}')`
    });

    if (groupParticipants.length === 0) return [];

    // Exclude anyone currently in the in-process group(s)
    const processingGroupIds = getEnvIds('VOLUNTEER_PROCESSING_GROUP_IDS');
    let filteredParticipants = groupParticipants;

    if (processingGroupIds.length > 0) {
      const inProcessGPs = await this.mp!.getTableRecords<{ Participant_ID: number }>({
        table: 'Group_Participants',
        select: 'Participant_ID',
        filter: `Group_ID IN (${processingGroupIds.join(',')}) AND (End_Date IS NULL OR End_Date >= '${now}')`
      });

      const inProcessParticipantIds = new Set(inProcessGPs.map(gp => gp.Participant_ID));
      filteredParticipants = groupParticipants.filter(
        gp => !inProcessParticipantIds.has(gp.Participant_ID)
      );
    }

    if (filteredParticipants.length === 0) return [];

    // Deduplicate by Participant_ID (a person may have multiple group roles)
    const uniqueByParticipant = new Map<number, GroupParticipantRecord>();
    for (const gp of filteredParticipants) {
      if (!uniqueByParticipant.has(gp.Participant_ID)) {
        uniqueByParticipant.set(gp.Participant_ID, gp);
      }
    }

    const participantIds = [...uniqueByParticipant.keys()];
    const contacts = await this.getContactsForParticipants(participantIds);

    const volunteers = this.buildVolunteerInfoList(
      [...uniqueByParticipant.values()],
      contacts
    );
    if (volunteers.length === 0) return [];

    return this.assembleVolunteerCards(volunteers);
  }

  // ---------------------------------------------------------------
  // Detail Modal
  // ---------------------------------------------------------------

  public async getVolunteerDetail(
    contactId: number,
    participantId: number,
    groupParticipantId: number
  ): Promise<VolunteerDetail | null> {
    // Get contact info
    const contacts = await this.mp!.getTableRecords<{
      Contact_ID: number;
      First_Name: string;
      Nickname: string | null;
      Last_Name: string;
      Image_GUID: string | null;
    }>({
      table: 'Contacts',
      select: 'Contact_ID,First_Name,Nickname,Last_Name,dp_fileUniqueId AS Image_GUID',
      filter: `Contact_ID = ${contactId}`,
      top: 1
    });

    if (contacts.length === 0) return null;
    const contact = contacts[0];

    // Build volunteer info
    const info: VolunteerInfo = {
      Contact_ID: contactId,
      Participant_ID: participantId,
      First_Name: contact.First_Name,
      Nickname: contact.Nickname,
      Last_Name: contact.Last_Name,
      Image_GUID: contact.Image_GUID,
      Group_Participant_ID: groupParticipantId,
      Start_Date: ''
    };

    // Fetch all checklist data in parallel
    const [formResponses, milestones, backgroundChecks, certifications, bgStatuses] =
      await Promise.all([
        this.fetchFormResponses([contactId]),
        this.fetchMilestones([participantId]),
        this.fetchBackgroundChecks([contactId]),
        this.fetchCertifications([participantId]),
        this.getBackgroundCheckStatuses()
      ]);

    // Build checklist
    const checklist = this.buildChecklistForVolunteer(
      contactId,
      participantId,
      formResponses,
      milestones,
      backgroundChecks,
      certifications,
      bgStatuses
    );

    // Build detail objects
    const contactBgChecks = backgroundChecks.filter(bc => bc.Contact_ID === contactId);
    const latestBg = contactBgChecks.length > 0 ? contactBgChecks[0] : null;

    const backgroundCheck: BackgroundCheckDetail | null = latestBg
      ? {
          Background_Check_ID: latestBg.Background_Check_ID,
          Status: latestBg.Background_Check_Status_ID
            ? bgStatuses.get(latestBg.Background_Check_Status_ID) || 'Unknown'
            : 'Unknown',
          Started: latestBg.Background_Check_Started,
          Submitted: latestBg.Background_Check_Submitted,
          Returned: latestBg.Background_Check_Returned,
          All_Clear: latestBg.All_Clear,
          Expires: latestBg.Background_Check_Expires,
          Report_Url: latestBg.Report_Url
        }
      : null;

    const participantCerts = certifications.filter(c => c.Participant_ID === participantId);
    const latestCert = participantCerts.length > 0 ? participantCerts[0] : null;

    const certification: CertificationDetail | null = latestCert
      ? {
          Participant_Certification_ID: latestCert.Participant_Certification_ID,
          Submitted: latestCert.Certification_Submitted,
          Completed: latestCert.Certification_Completed,
          Expires: latestCert.Certification_Expires,
          Passed: latestCert.Passed
        }
      : null;

    const appFormId = getEnvId('VOLUNTEER_APPLICATION_FORM_ID');

    const formResponseDetails: FormResponseDetail[] = formResponses
      .filter(fr => fr.Contact_ID === contactId)
      .map(fr => ({
        Form_Response_ID: fr.Form_Response_ID,
        Form_ID: fr.Form_ID,
        Response_Date: fr.Response_Date,
        Expires: fr.Expires,
        type: fr.Form_ID === appFormId ? 'application' as const : 'child_protection' as const
      }));

    const interviewMilestoneId = getEnvId('VOLUNTEER_INTERVIEW_MILESTONE_ID');
    const milestoneDetails: MilestoneDetail[] = milestones
      .filter(m => m.Participant_ID === participantId)
      .map(m => ({
        Participant_Milestone_ID: m.Participant_Milestone_ID,
        Milestone_ID: m.Milestone_ID,
        Date_Accomplished: m.Date_Accomplished,
        Notes: m.Notes,
        type: m.Milestone_ID === interviewMilestoneId ? 'interview' as const : 'reference' as const
      }));

    const writeBackConfig: WriteBackConfig = {
      programId: getEnvId('VOLUNTEER_PROGRAM_ID'),
      interviewMilestoneId: getEnvId('VOLUNTEER_INTERVIEW_MILESTONE_ID'),
      referenceMilestoneId: getEnvId('VOLUNTEER_REFERENCE_MILESTONE_ID'),
      reference2MilestoneId: getEnvId('VOLUNTEER_REFERENCE_2_MILESTONE_ID'),
      reference3MilestoneId: getEnvId('VOLUNTEER_REFERENCE_3_MILESTONE_ID'),
    };

    return {
      info,
      checklist,
      completedCount: checklist.filter(c => c.status === 'complete').length,
      totalCount: checklist.length,
      backgroundCheck,
      certification,
      formResponses: formResponseDetails,
      milestones: milestoneDetails,
      writeBackConfig
    };
  }

  // ---------------------------------------------------------------
  // Write-back: Create Milestone
  // ---------------------------------------------------------------

  public async createMilestone(data: {
    Participant_ID: number;
    Milestone_ID: number;
    Program_ID: number;
    Date_Accomplished?: string;
    Notes?: string;
  }, userId?: number): Promise<number> {
    const record = {
      ...data,
      Date_Accomplished: data.Date_Accomplished || new Date().toISOString(),
    };

    const created = await this.mp!.createTableRecords(
      'Participant_Milestones', [record], {
        $userId: userId
      }
    ) as unknown as { Participant_Milestone_ID: number }[];

    return created[0].Participant_Milestone_ID;
  }

  // ---------------------------------------------------------------
  // Write-back: Upload Document
  // ---------------------------------------------------------------

  public async uploadDocument(
    table: string,
    recordId: number,
    files: File[],
    userId?: number
  ): Promise<void> {
    await this.mp!.uploadFiles({
      table,
      recordId,
      files,
      uploadParams: {
        description: 'Uploaded via Volunteer Processing',
        userId
      }
    });
  }

  // ---------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------

  private async getContactsForParticipants(
    participantIds: number[]
  ): Promise<Map<number, ContactRecord>> {
    if (participantIds.length === 0) return new Map();

    // Get Participant → Contact_ID mapping (batched to avoid URL length limits)
    const allParticipants: ParticipantRecord[] = [];
    for (let i = 0; i < participantIds.length; i += BATCH_SIZE) {
      const batchIds = participantIds.slice(i, i + BATCH_SIZE);
      const batch = await this.mp!.getTableRecords<ParticipantRecord>({
        table: 'Participants',
        select: 'Participant_ID,Contact_ID',
        filter: `Participant_ID IN (${batchIds.join(',')})`
      });
      allParticipants.push(...batch);
    }

    const contactIds = [...new Set(allParticipants.map(p => p.Contact_ID))];
    if (contactIds.length === 0) return new Map();

    // Get contact details (batched)
    const allContacts: { Contact_ID: number; First_Name: string; Nickname: string | null; Last_Name: string; Image_GUID: string | null }[] = [];
    for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
      const batchIds = contactIds.slice(i, i + BATCH_SIZE);
      const batch = await this.mp!.getTableRecords<{
        Contact_ID: number;
        First_Name: string;
        Nickname: string | null;
        Last_Name: string;
        Image_GUID: string | null;
      }>({
        table: 'Contacts',
        select: 'Contact_ID,First_Name,Nickname,Last_Name,dp_fileUniqueId AS Image_GUID',
        filter: `Contact_ID IN (${batchIds.join(',')})`
      });
      allContacts.push(...batch);
    }

    // Build map: Participant_ID → ContactRecord
    const contactMap = new Map(allContacts.map(c => [c.Contact_ID, c]));
    const result = new Map<number, ContactRecord>();

    for (const p of allParticipants) {
      const contact = contactMap.get(p.Contact_ID);
      if (contact) {
        result.set(p.Participant_ID, {
          Contact_ID: contact.Contact_ID,
          Participant_ID: p.Participant_ID,
          First_Name: contact.First_Name,
          Nickname: contact.Nickname,
          Last_Name: contact.Last_Name,
          Image_GUID: contact.Image_GUID
        });
      }
    }

    return result;
  }

  private buildVolunteerInfoList(
    groupParticipants: GroupParticipantRecord[],
    contacts: Map<number, ContactRecord>
  ): VolunteerInfo[] {
    const volunteers: VolunteerInfo[] = [];

    for (const gp of groupParticipants) {
      const contact = contacts.get(gp.Participant_ID);
      if (!contact) continue;

      volunteers.push({
        Contact_ID: contact.Contact_ID,
        Participant_ID: gp.Participant_ID,
        First_Name: contact.First_Name,
        Nickname: contact.Nickname,
        Last_Name: contact.Last_Name,
        Image_GUID: contact.Image_GUID,
        Group_Participant_ID: gp.Group_Participant_ID,
        Start_Date: gp.Start_Date
      });
    }

    // Sort alphabetically by last name
    volunteers.sort((a, b) => a.Last_Name.localeCompare(b.Last_Name));
    return volunteers;
  }

  private async assembleVolunteerCards(
    volunteers: VolunteerInfo[]
  ): Promise<VolunteerCard[]> {
    const contactIds = [...new Set(volunteers.map(v => v.Contact_ID))];
    const participantIds = [...new Set(volunteers.map(v => v.Participant_ID))];

    // Fetch all checklist data in parallel
    const [formResponses, milestones, backgroundChecks, certifications, bgStatuses] =
      await Promise.all([
        this.fetchFormResponses(contactIds),
        this.fetchMilestones(participantIds),
        this.fetchBackgroundChecks(contactIds),
        this.fetchCertifications(participantIds),
        this.getBackgroundCheckStatuses()
      ]);

    // Build cards
    return volunteers.map(vol => {
      const checklist = this.buildChecklistForVolunteer(
        vol.Contact_ID,
        vol.Participant_ID,
        formResponses,
        milestones,
        backgroundChecks,
        certifications,
        bgStatuses
      );

      return {
        info: vol,
        checklist,
        completedCount: checklist.filter(c => c.status === 'complete').length,
        totalCount: checklist.length
      };
    });
  }

  // ---------------------------------------------------------------
  // Bulk Data Fetchers
  // ---------------------------------------------------------------

  private async fetchFormResponses(contactIds: number[]): Promise<FormResponseRecord[]> {
    const appFormId = getEnvId('VOLUNTEER_APPLICATION_FORM_ID');
    const cpFormId = getEnvId('VOLUNTEER_CHILD_PROTECTION_FORM_ID');

    const formIds = [appFormId, cpFormId].filter((id): id is number => id !== null);
    if (formIds.length === 0 || contactIds.length === 0) return [];

    const allResults: FormResponseRecord[] = [];
    for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
      const batchIds = contactIds.slice(i, i + BATCH_SIZE);
      const batch = await this.mp!.getTableRecords<FormResponseRecord>({
        table: 'Form_Responses',
        select: 'Form_Response_ID,Form_ID,Contact_ID,Response_Date,Expires',
        filter: `Form_ID IN (${formIds.join(',')}) AND Contact_ID IN (${batchIds.join(',')})`,
        orderBy: 'Response_Date DESC'
      });
      allResults.push(...batch);
    }
    return allResults;
  }

  private async fetchMilestones(participantIds: number[]): Promise<MilestoneRecord[]> {
    const interviewId = getEnvId('VOLUNTEER_INTERVIEW_MILESTONE_ID');
    const refId = getEnvId('VOLUNTEER_REFERENCE_MILESTONE_ID');
    const ref2Id = getEnvId('VOLUNTEER_REFERENCE_2_MILESTONE_ID');
    const ref3Id = getEnvId('VOLUNTEER_REFERENCE_3_MILESTONE_ID');

    const milestoneIds = [interviewId, refId, ref2Id, ref3Id].filter(
      (id): id is number => id !== null
    );
    if (milestoneIds.length === 0 || participantIds.length === 0) return [];

    const allResults: MilestoneRecord[] = [];
    for (let i = 0; i < participantIds.length; i += BATCH_SIZE) {
      const batchIds = participantIds.slice(i, i + BATCH_SIZE);
      const batch = await this.mp!.getTableRecords<MilestoneRecord>({
        table: 'Participant_Milestones',
        select: 'Participant_Milestone_ID,Participant_ID,Milestone_ID,Date_Accomplished,Notes',
        filter: `Milestone_ID IN (${milestoneIds.join(',')}) AND Participant_ID IN (${batchIds.join(',')})`,
        orderBy: 'Date_Accomplished DESC'
      });
      allResults.push(...batch);
    }
    return allResults;
  }

  private async fetchBackgroundChecks(contactIds: number[]): Promise<BackgroundCheckRecord[]> {
    if (contactIds.length === 0) return [];

    const allResults: BackgroundCheckRecord[] = [];
    for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
      const batchIds = contactIds.slice(i, i + BATCH_SIZE);
      const batch = await this.mp!.getTableRecords<BackgroundCheckRecord>({
        table: 'Background_Checks',
        select: 'Background_Check_ID,Contact_ID,Background_Check_Status_ID,Background_Check_Started,Background_Check_Submitted,Background_Check_Returned,All_Clear,Background_Check_Expires,Report_Url',
        filter: `Contact_ID IN (${batchIds.join(',')})`,
        orderBy: 'Background_Check_Started DESC'
      });
      allResults.push(...batch);
    }
    return allResults;
  }

  private async fetchCertifications(participantIds: number[]): Promise<CertificationRecord[]> {
    const certTypeId = getEnvId('VOLUNTEER_MANDATED_REPORTER_CERT_TYPE_ID');
    if (certTypeId === null || participantIds.length === 0) return [];

    const allResults: CertificationRecord[] = [];
    for (let i = 0; i < participantIds.length; i += BATCH_SIZE) {
      const batchIds = participantIds.slice(i, i + BATCH_SIZE);
      const batch = await this.mp!.getTableRecords<CertificationRecord>({
        table: 'Participant_Certifications',
        select: 'Participant_Certification_ID,Participant_ID,Certification_Type_ID,Certification_Submitted,Certification_Completed,Certification_Expires,Passed',
        filter: `Certification_Type_ID = ${certTypeId} AND Participant_ID IN (${batchIds.join(',')})`,
        orderBy: 'Certification_Submitted DESC'
      });
      allResults.push(...batch);
    }
    return allResults;
  }

  // ---------------------------------------------------------------
  // Checklist Builder
  // ---------------------------------------------------------------

  private buildChecklistForVolunteer(
    contactId: number,
    participantId: number,
    formResponses: FormResponseRecord[],
    milestones: MilestoneRecord[],
    backgroundChecks: BackgroundCheckRecord[],
    certifications: CertificationRecord[],
    bgStatuses: Map<number, string>
  ): ChecklistItemStatus[] {
    const appFormId = getEnvId('VOLUNTEER_APPLICATION_FORM_ID');
    const cpFormId = getEnvId('VOLUNTEER_CHILD_PROTECTION_FORM_ID');
    const interviewId = getEnvId('VOLUNTEER_INTERVIEW_MILESTONE_ID');
    const refId = getEnvId('VOLUNTEER_REFERENCE_MILESTONE_ID');
    const ref2Id = getEnvId('VOLUNTEER_REFERENCE_2_MILESTONE_ID');
    const ref3Id = getEnvId('VOLUNTEER_REFERENCE_3_MILESTONE_ID');

    const checklist: ChecklistItemStatus[] = [];

    // 1. Application
    const appResponse = formResponses.find(
      fr => fr.Form_ID === appFormId && fr.Contact_ID === contactId
    );
    checklist.push({
      key: 'application',
      label: 'Application',
      completed: !!appResponse,
      date: appResponse?.Response_Date || null,
      expires: null,
      status: appResponse ? 'complete' : 'not_started',
      detail: null
    });

    // 2. Interview
    const interviewMilestone = milestones.find(
      m => m.Milestone_ID === interviewId && m.Participant_ID === participantId
    );
    checklist.push({
      key: 'interview',
      label: 'Interview',
      completed: !!interviewMilestone?.Date_Accomplished,
      date: interviewMilestone?.Date_Accomplished || null,
      expires: null,
      status: interviewMilestone?.Date_Accomplished ? 'complete' : 'not_started',
      detail: interviewMilestone?.Notes || null
    });

    // 3, 4 & 5. References
    const refMilestoneIds = [refId, ref2Id, ref3Id].filter((id): id is number => id !== null);
    const referenceMilestones = milestones.filter(m => {
      if (m.Participant_ID !== participantId) return false;
      return refMilestoneIds.includes(m.Milestone_ID);
    });

    // Reference 1
    const ref1 = referenceMilestones[0] || null;
    checklist.push({
      key: 'reference_1',
      label: 'Reference 1',
      completed: !!ref1?.Date_Accomplished,
      date: ref1?.Date_Accomplished || null,
      expires: null,
      status: ref1?.Date_Accomplished ? 'complete' : 'not_started',
      detail: ref1?.Notes || null
    });

    // Reference 2
    const ref2 = referenceMilestones[1] || null;
    checklist.push({
      key: 'reference_2',
      label: 'Reference 2',
      completed: !!ref2?.Date_Accomplished,
      date: ref2?.Date_Accomplished || null,
      expires: null,
      status: ref2?.Date_Accomplished ? 'complete' : 'not_started',
      detail: ref2?.Notes || null
    });

    // Reference 3
    const ref3 = referenceMilestones[2] || null;
    checklist.push({
      key: 'reference_3',
      label: 'Reference 3',
      completed: !!ref3?.Date_Accomplished,
      date: ref3?.Date_Accomplished || null,
      expires: null,
      status: ref3?.Date_Accomplished ? 'complete' : 'not_started',
      detail: ref3?.Notes || null
    });

    // 6. Background Check
    const contactBgChecks = backgroundChecks.filter(bc => bc.Contact_ID === contactId);
    const latestBg = contactBgChecks[0] || null;

    let bgStatus: ChecklistItemStatus['status'] = 'not_started';
    let bgDetail: string | null = null;
    let bgCompleted = false;

    if (latestBg) {
      const statusName = latestBg.Background_Check_Status_ID
        ? bgStatuses.get(latestBg.Background_Check_Status_ID) || 'Unknown'
        : null;
      bgDetail = statusName;

      if (latestBg.All_Clear === true) {
        bgCompleted = true;
        bgStatus = latestBg.Background_Check_Expires
          ? getExpirationStatus(true, latestBg.Background_Check_Expires)
          : 'complete';
      } else if (latestBg.Background_Check_Returned) {
        // Returned but not all clear
        bgStatus = 'complete';
        bgCompleted = true;
        bgDetail = statusName || 'Returned - review needed';
      } else if (latestBg.Background_Check_Submitted) {
        bgStatus = 'in_progress';
        bgDetail = statusName || 'Submitted - awaiting results';
      } else {
        bgStatus = 'in_progress';
        bgDetail = statusName || 'Started';
      }
    }

    checklist.push({
      key: 'background_check',
      label: 'Background Check',
      completed: bgCompleted,
      date: latestBg?.Background_Check_Returned || latestBg?.Background_Check_Started || null,
      expires: latestBg?.Background_Check_Expires || null,
      status: bgStatus,
      detail: bgDetail
    });

    // 6. Mandated Reporter Certification
    const participantCerts = certifications.filter(
      c => c.Participant_ID === participantId
    );
    const latestCert = participantCerts[0] || null;

    let certStatus: ChecklistItemStatus['status'] = 'not_started';
    let certCompleted = false;

    if (latestCert) {
      if (latestCert.Certification_Completed || latestCert.Passed) {
        certCompleted = true;
        certStatus = getExpirationStatus(true, latestCert.Certification_Expires);
      } else {
        certStatus = 'in_progress';
      }
    }

    checklist.push({
      key: 'mandated_reporter',
      label: 'Mandated Reporter',
      completed: certCompleted,
      date: latestCert?.Certification_Completed || latestCert?.Certification_Submitted || null,
      expires: latestCert?.Certification_Expires || null,
      status: certStatus,
      detail: null
    });

    // 7. Child Protection Policy
    const cpResponses = formResponses.filter(
      fr => fr.Form_ID === cpFormId && fr.Contact_ID === contactId
    );
    const latestCp = cpResponses[0] || null;

    let cpStatus: ChecklistItemStatus['status'] = 'not_started';
    let cpCompleted = false;

    if (latestCp) {
      cpCompleted = true;
      cpStatus = getExpirationStatus(true, latestCp.Expires);
    }

    checklist.push({
      key: 'child_protection',
      label: 'Child Protection Policy',
      completed: cpCompleted,
      date: latestCp?.Response_Date || null,
      expires: latestCp?.Expires || null,
      status: cpStatus,
      detail: null
    });

    return checklist;
  }
}
