export type FileCategory = 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'archive';

export type AccessScope = 'organization' | 'department' | 'restricted';

export type UserRole = 'Administrator' | 'Department Lead' | 'Staff';

export type SharePermission = 'view' | 'organize';

export type NavSection =
  | 'all'
  | 'shared'
  | 'recent'
  | 'starred'
  | 'activity'
  | 'users'
  | 'trash';

export type SortField = 'updatedAt' | 'title' | 'recordId' | 'sizeBytes';
export type SortDirection = 'asc' | 'desc';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  department: string;
  role: UserRole;
  workstationId: string;
  initials: string;
  status: 'Active' | 'Suspended';
  lastActiveAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  department: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface ShareGrant {
  userId: string;
  permission: SharePermission;
  grantedAt: string;
  grantedBy: string;
}

export interface DocumentPreviewSection {
  heading: string;
  body: string;
}

export interface DocumentRecord {
  id: string;
  recordId: string;
  title: string;
  fileName: string;
  extension: string;
  fileCategory: FileCategory;
  mimeType: string;
  sizeBytes: number;
  folderId: string;
  department: string;
  ownerId: string;
  workstationOrigin: string;
  accessScope: AccessScope;
  sharedWith: ShareGrant[];
  tags: string[];
  description: string;
  uploadedAt: string;
  updatedAt: string;
  lastRetrievedAt?: string;
  retrievalCount: number;
  isStarred: boolean;
  isTrashed: boolean;
  trashedAt?: string;
  checksum: string;
  storagePath: string;
  /** Optional real uploaded file object URL for live preview and download */
  blobUrl?: string;
  /** Optional real uploaded plain text content */
  rawTextContent?: string;
  /** Structured read-only preview lines for seeded digital records */
  previewSections?: DocumentPreviewSection[];
}

export type ActivityAction =
  | 'uploaded'
  | 'retrieved'
  | 'shared'
  | 'organized'
  | 'starred'
  | 'trashed'
  | 'restored'
  | 'folder_created'
  | 'user_updated';

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actorId: string;
  workstationId: string;
  action: ActivityAction;
  targetName: string;
  recordId?: string;
  details: string;
}
