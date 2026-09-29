export interface TableQueryParams {
  $select?: string;
  $filter?: string;
  $orderby?: string;
  $groupby?: string;
  $having?: string;
  $top?: number;
  $skip?: number;
  $distinct?: boolean;
  $userId?: number;
  $globalFilterId?: number;
  $allowCreate?: boolean;
}

export interface TableRecord {
  [key: string]: unknown;
}

export interface FileDescription {
  FileId: number;
  FileName: string;
  readonly FileExtension?: string;
  Description?: string;
  FileSize: number;
  ImageHeight?: number;
  ImageWidth?: number;
  readonly IsImage: boolean;
  IsDefaultImage: boolean;
  TableName: string;
  RecordId: number;
  UniqueFileId: string;
  LastUpdated: string;
  InclusionType: 'Attachment' | 'Link';
}

/**
 * The `CommunicationType` values this template lets `POST /communications`
 * send: a deliberate subset of MP's `Platform.Messaging.CommunicationType`
 * enum, which is `Unknown | Email | SMS | RssFeed | GlobalMFA`.
 *
 * Verified against a live MP tenant on 2026-09-08 rather than taken from the
 * Swagger alone: `dp_Communication_Types` holds `1 Email`, `2 SMS Text`,
 * `3 RSS Feed` and `4 GlobalMFA`; `Unknown` is the zero value and has no row.
 * Only `Email` and `SMS` are permitted: `Unknown` is not a real channel,
 * `GlobalMFA` is MP's own multi-factor channel, and `RssFeed` is not a message
 * to contacts. `CommunicationService` enforces the same list at runtime.
 *
 * This was previously typed `'Email' | 'Text' | 'Letter'`. Neither `'Text'`
 * nor `'Letter'` was ever a member, and MP rejects either with an opaque
 * HTTP **500** rather than a 400:
 *
 * ```
 * {"Message":"Error converting value \"Text\" to type
 *   'Platform.Messaging.CommunicationType'. Path 'CommunicationType' ...
 *   Requested value 'Text' was not found."}
 * ```
 *
 * `'Email'` happens to be a real member, and it is the only value anyone had
 * ever passed — which is why the other two went unnoticed.
 *
 * Only ever add a value that is a member of MP's enum.
 */
export const COMMUNICATION_TYPES = ['Email', 'SMS'] as const;

export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

interface CommunicationInfoBase {
  AuthorUserId: number;
  Body: string;
  FromContactId: number;
  ReplyToContactId: number;
  Contacts: number[];
  IsBulkEmail: boolean;
  SendToContactParents: boolean;
  Subject: string;
  StartDate: string;
}

/**
 * A communication to hand to `POST /communications`.
 *
 * Modelled as a discriminated union rather than one interface because
 * `TextPhoneNumberId` is **conditionally required**: MP's Swagger marks it
 * optional, but an `'SMS'` send without it fails with
 * `Property 'TextPhoneNumberId' is required and must be populated` — another
 * 500, not a 400. Making the compiler ask for it turns a runtime failure into
 * a build failure; `CommunicationService.createCommunication` re-checks at
 * runtime for callers that arrive through an `as` cast or untyped JSON.
 */
export type CommunicationInfo =
  | (CommunicationInfoBase & {
      CommunicationType: 'SMS';
      /**
       * `dp_SMS_Numbers.SMS_Number_ID` of the outbound number. Required for
       * SMS; a tenant's numbers are listed in `dp_SMS_Numbers`.
       */
      TextPhoneNumberId: number;
    })
  | (CommunicationInfoBase & {
      CommunicationType: 'Email';
      TextPhoneNumberId?: number;
    });

export interface MessageAddress {
  DisplayName: string;
  Address: string;
}

export interface MessageInfo {
  FromAddress: MessageAddress;
  ToAddresses: MessageAddress[];
  ReplyToAddress?: MessageAddress;
  Subject: string;
  Body: string;
  StartDate?: string;
}

/**
 * What a caller of `MPHelper.createCommunication` supplies: a
 * {@link CommunicationInfo} without the author/from fields, which are stamped
 * from the separate trusted `CommunicationSender` argument instead. Values for
 * them left on the object are ignored.
 *
 * The `Omit` is applied to each member of the union separately. A plain
 * `Omit<CommunicationInfo, ...>` merges the members, so an `'SMS'` payload
 * without `TextPhoneNumberId` would compile again.
 */
export type CommunicationContent = DistributiveOmit<CommunicationInfo, 'AuthorUserId' | 'FromContactId'>;

/** `Omit` applied to each member of a union rather than to the merged union. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * What a caller of `MPHelper.sendMessage` supplies: a {@link MessageInfo}
 * without `FromAddress`, which comes from the trusted `MessageSender` argument.
 */
export type MessageContent = Omit<MessageInfo, 'FromAddress'>;

export interface Communication {
  Communication_ID: number;
  Author_User_ID: number;
  Subject: string;
  Body: string;
  Domain_ID: number;
  Start_Date: string;
  Communication_Status_ID: number;
  From_Contact: number;
  Reply_to_Contact: number;
  Template_ID?: number;
  Active: boolean;
}

export interface DomainInfo {
  DisplayName: string;
  ImageFileId?: number;
  TimeZoneName: string;
  CultureName: string;
  PasswordComplexityExpression?: string;
  PasswordComplexityMessage?: string;
  IsSimpleSignOnEnabled: boolean;
  IsUserTimeZoneEnabled: boolean;
  IsSmsMfaEnabled: boolean;
  CompanyName?: string;
  CompanyEmail?: string;
  CompanyPhone?: string;
  GlobalFilterTableName?: string;
  SiteNumber?: string;
}

export interface GlobalFilterItem {
  Key: number;
  Value: string;
}

/**
 * `$ignorePermissions` is deliberately absent: requests already run as the
 * admin-level service account, and `DomainService` never forwards it.
 */
export interface GlobalFilterParams {
  $userId?: number;
}

export type ParameterDirection = 
  | "Input"
  | "Output"
  | "InputOutput"
  | "ReturnValue";

export type ParameterDataType = 
  | "Unknown"
  | "String"
  | "Text"
  | "Xml"
  | "Byte"
  | "Integer16"
  | "Integer32"
  | "Integer64"
  | "Decimal"
  | "Real"
  | "Boolean"
  | "Date"
  | "Time"
  | "DateTime"
  | "Timestamp"
  | "Binary"
  | "Password"
  | "Money"
  | "Guid"
  | "Phone"
  | "Email"
  | "Variant"
  | "Separator"
  | "Image"
  | "Counter"
  | "TableName"
  | "GlobalFilter"
  | "TimeZone"
  | "Locale"
  | "LargeString"
  | "Url"
  | "Strings"
  | "Integers"
  | "Color"
  | "SecretKey";

export interface ParameterInfo {
  Name: string;
  Direction: ParameterDirection;
  DataType: ParameterDataType;
  Size: number;
}

export interface ProcedureInfo {
  Name: string;
  Parameters: ParameterInfo[];
}

export interface TableInfo {
  Name: string;
  DisplayName: string;
  Description?: string;
  Active: boolean;
  Table_ID: number;
}

export interface FileUploadParams {
  description?: string;
  isDefaultImage?: boolean;
  longestDimension?: number;
  userId?: number;
}

export interface FileUpdateParams {
  fileName?: string;
  description?: string;
  isDefaultImage?: boolean;
  longestDimension?: number;
  userId?: number;
}

export interface QueryParams {
  [key: string]: string | number | boolean | string[] | number[] | boolean[] | undefined | null;
}

export interface RequestBody {
  [key: string]: unknown;
}

export interface TableMetadata {
  Table_ID: number;
  Table_Name: string;
  Display_Name: string;
  Description?: string;
  Columns?: ColumnMetadata[];
  [key: string]: unknown;
}

export interface ColumnMetadata {
  Name: string;
  DataType: ParameterDataType;
  IsRequired: boolean;
  Size: number;
  IsPrimaryKey?: boolean;
  IsForeignKey?: boolean;
  ReferencedTable?: string;
  ReferencedColumn?: string;
  IsReadOnly?: boolean;
  IsComputed?: boolean;
  HasDefault?: boolean;
}
