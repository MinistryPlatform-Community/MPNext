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

export interface CommunicationInfo {
  AuthorUserId: number;
  Body: string;
  FromContactId: number;
  ReplyToContactId: number;
  CommunicationType: 'Email' | 'Text' | 'Letter';
  Contacts: number[];
  IsBulkEmail: boolean;
  SendToContactParents: boolean;
  Subject: string;
  StartDate: string;
  TextPhoneNumberId?: number;
}

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
 */
export type CommunicationContent = Omit<CommunicationInfo, 'AuthorUserId' | 'FromContactId'>;

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
