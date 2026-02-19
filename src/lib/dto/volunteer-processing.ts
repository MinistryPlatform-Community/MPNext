export interface VolunteerInfo {
  Contact_ID: number;
  Participant_ID: number;
  Nickname: string | null;
  Last_Name: string;
  First_Name: string;
  Image_GUID: string | null;
  Group_Participant_ID: number;
  Start_Date: string;
}

export interface ChecklistItemStatus {
  key: string;
  label: string;
  completed: boolean;
  date: string | null;
  expires: string | null;
  status: 'complete' | 'in_progress' | 'expired' | 'expiring_soon' | 'not_started' | 'presumed_complete';
  detail: string | null;
}

export interface VolunteerCard {
  info: VolunteerInfo;
  checklist: ChecklistItemStatus[];
  completedCount: number;
  totalCount: number;
  fullyApproved: boolean;
  elderApprovedTeacher: boolean;
  groupIds: number[];
}

export interface GroupFilterOption {
  Group_ID: number;
  Group_Name: string;
}

export interface ApprovedVolunteersResult {
  volunteers: VolunteerCard[];
  groups: GroupFilterOption[];
}

export interface BackgroundCheckDetail {
  Background_Check_ID: number;
  Status: string;
  Started: string | null;
  Submitted: string | null;
  Returned: string | null;
  All_Clear: boolean | null;
  Expires: string | null;
  Report_Url: string | null;
}

export interface CertificationDetail {
  Participant_Certification_ID: number;
  Submitted: string;
  Completed: string | null;
  Expires: string | null;
  Passed: boolean | null;
}

export interface FormResponseDetail {
  Form_Response_ID: number;
  Form_ID: number;
  Response_Date: string;
  Expires: string | null;
  type: 'application' | 'child_protection';
}

export interface MilestoneDetail {
  Participant_Milestone_ID: number;
  Milestone_ID: number;
  Date_Accomplished: string | null;
  Notes: string | null;
  type: 'interview' | 'reference' | 'fully_approved' | 'elder_approved_teacher';
}

export interface MilestoneFileInfo {
  fileId: number;
  fileName: string;
  fileUrl: string;
  isPdf: boolean;
  isImage: boolean;
}

export interface WriteBackConfig {
  programId: number | null;
  interviewMilestoneId: number | null;
  referenceMilestoneId: number | null;
  reference2MilestoneId: number | null;
  reference3MilestoneId: number | null;
  fullyApprovedMilestoneId: number | null;
  elderApprovedTeacherMilestoneId: number | null;
}

export interface VolunteerDetail extends VolunteerCard {
  backgroundCheck: BackgroundCheckDetail | null;
  certification: CertificationDetail | null;
  formResponses: FormResponseDetail[];
  milestones: MilestoneDetail[];
  writeBackConfig: WriteBackConfig;
}
