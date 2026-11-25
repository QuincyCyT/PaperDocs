import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LayoutGrid,
  List,
  FolderInput,
  Download,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type {
  AccessScope,
  ActivityAction,
  ActivityEntry,
  DocumentRecord,
  FileCategory,
  FolderItem,
  NavSection,
  ShareGrant,
  SortDirection,
  SortField,
  UserAccount,
  UserRole,
} from './types/dms';
import {
  INITIAL_ACTIVITY,
  INITIAL_DOCUMENTS,
  INITIAL_FOLDERS,
  INITIAL_USERS,
} from './data/seedData';
import {
  canUserAccessDocument,
  canUserManageDocument,
  detectFileCategory,
  formatBytes,
  generateChecksum,
  getExtension,
  triggerDocumentDownload,
} from './utils/formatters';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DocumentTable } from './components/DocumentTable';
import { DocumentGrid } from './components/DocumentGrid';
import { DocumentInspector } from './components/DocumentInspector';
import { UploadModal, type UploadSubmission } from './components/UploadModal';
import { ShareModal } from './components/ShareModal';
import { OrganizeModal } from './components/OrganizeModal';
import { NewFolderModal } from './components/NewFolderModal';
import { ActivityLogView } from './components/ActivityLogView';
import { UsersView } from './components/UsersView';
import { SignInScreen } from './components/SignInScreen';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info';
}

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [folders, setFolders] = useState<FolderItem[]>(INITIAL_FOLDERS);
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);
  const [activities, setActivities] = useState<ActivityEntry[]>(INITIAL_ACTIVITY);

  const [currentUserId, setCurrentUserId] = useState<string | null>(INITIAL_USERS[0].id);
  const [activeSection, setActiveSection] = useState<NavSection>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'all'>('all');
  const [scopeFilter, setScopeFilter] = useState<AccessScope | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSwitchingView, setIsSwitchingView] = useState(false);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [organizeDocId, setOrganizeDocId] = useState<string | null>(null);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, tone: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId]
  );

  const usersById = useMemo(() => {
    const map: Record<string, UserAccount> = {};
    for (const u of users) map[u.id] = u;
    return map;
  }, [users]);

  const foldersById = useMemo(() => {
    const map: Record<string, FolderItem> = {};
    for (const f of folders) map[f.id] = f;
    return map;
  }, [folders]);

  const appendActivity = useCallback(
    (
      action: ActivityAction,
      targetName: string,
      details: string,
      recordId?: string
    ) => {
      if (!currentUser) return;
      const entry: ActivityEntry = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        workstationId: currentUser.workstationId,
        action,
        targetName,
        recordId,
        details,
      };
      setActivities((prev) => [entry, ...prev]);
    },
    [currentUser]
  );

  // Documents accessible to the signed-in user
  const accessibleDocuments = useMemo(() => {
    if (!currentUser) return [];
    return documents.filter((doc) => canUserAccessDocument(doc, currentUser));
  }, [documents, currentUser]);

  const activeAccessibleDocs = useMemo(
    () => accessibleDocuments.filter((d) => !d.isTrashed),
    [accessibleDocuments]
  );

  const trashedAccessibleDocs = useMemo(
    () => accessibleDocuments.filter((d) => d.isTrashed),
    [accessibleDocuments]
  );

  const sectionCounts = useMemo(() => {
    if (!currentUser) {
      return { all: 0, shared: 0, recent: 0, starred: 0, trash: 0 };
    }
    const shared = activeAccessibleDocs.filter(
      (d) =>
        d.ownerId !== currentUser.id ||
        d.accessScope === 'organization' ||
        d.sharedWith.length > 0
    ).length;
    const recent = activeAccessibleDocs.filter((d) => Boolean(d.lastRetrievedAt)).length;
    const starred = activeAccessibleDocs.filter((d) => d.isStarred).length;
    return {
      all: activeAccessibleDocs.length,
      shared,
      recent,
      starred,
      trash: trashedAccessibleDocs.length,
    };
  }, [activeAccessibleDocs, trashedAccessibleDocs, currentUser]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of activeAccessibleDocs) {
      counts[doc.folderId] = (counts[doc.folderId] ?? 0) + 1;
    }
    return counts;
  }, [activeAccessibleDocs]);

  const totalStorageBytes = useMemo(
    () => documents.reduce((sum, doc) => sum + doc.sizeBytes, 0),
    [documents]
  );

  const totalRetrievals = useMemo(
    () => activeAccessibleDocs.reduce((sum, doc) => sum + doc.retrievalCount, 0),
    [activeAccessibleDocs]
  );

  // Visible documents after view, folder, search, filter, and sorting
  const visibleDocuments = useMemo(() => {
    if (!currentUser) return [];

    let list: DocumentRecord[];
    if (activeFolderId) {
      list = activeAccessibleDocs.filter((d) => d.folderId === activeFolderId);
    } else if (activeSection === 'trash') {
      list = trashedAccessibleDocs;
    } else if (activeSection === 'shared') {
      list = activeAccessibleDocs.filter(
        (d) =>
          d.ownerId !== currentUser.id ||
          d.accessScope === 'organization' ||
          d.sharedWith.length > 0
      );
    } else if (activeSection === 'recent') {
      list = activeAccessibleDocs
        .filter((d) => Boolean(d.lastRetrievedAt))
        .sort(
          (a, b) =>
            new Date(b.lastRetrievedAt ?? 0).getTime() -
            new Date(a.lastRetrievedAt ?? 0).getTime()
        );
    } else if (activeSection === 'starred') {
      list = activeAccessibleDocs.filter((d) => d.isStarred);
    } else {
      list = activeAccessibleDocs;
    }

    if (categoryFilter !== 'all') {
      list = list.filter((d) => d.fileCategory === categoryFilter);
    }

    if (scopeFilter !== 'all') {
      list = list.filter((d) => d.accessScope === scopeFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((doc) => {
        const owner = usersById[doc.ownerId];
        const folder = foldersById[doc.folderId];
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.fileName.toLowerCase().includes(q) ||
          doc.recordId.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q) ||
          doc.department.toLowerCase().includes(q) ||
          (folder?.name.toLowerCase().includes(q) ?? false) ||
          (owner?.fullName.toLowerCase().includes(q) ?? false) ||
          doc.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === 'recordId') {
        cmp = a.recordId.localeCompare(b.recordId);
      } else if (sortField === 'sizeBytes') {
        cmp = a.sizeBytes - b.sizeBytes;
      } else {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [
    currentUser,
    activeFolderId,
    activeSection,
    activeAccessibleDocs,
    trashedAccessibleDocs,
    categoryFilter,
    scopeFilter,
    searchQuery,
    usersById,
    foldersById,
    sortField,
    sortDirection,
  ]);

  const selectedDocument = useMemo(
    () => accessibleDocuments.find((d) => d.id === selectedDocId) ?? null,
    [accessibleDocuments, selectedDocId]
  );

  const shareDocument = useMemo(
    () => documents.find((d) => d.id === shareDocId) ?? null,
    [documents, shareDocId]
  );

  const organizeDocument = useMemo(
    () => documents.find((d) => d.id === organizeDocId) ?? null,
    [documents, organizeDocId]
  );

  const selectedDocActivities = useMemo(() => {
    if (!selectedDocument) return [];
    return activities.filter((a) => a.recordId === selectedDocument.recordId);
  }, [activities, selectedDocument]);

  // Handlers
  function handleSelectSection(section: NavSection) {
    setActiveSection(section);
    setActiveFolderId(null);
    setCheckedIds(new Set());
    if (section === 'activity' || section === 'users') {
      setSelectedDocId(null);
    }
  }

  function handleSelectFolder(folderId: string) {
    setActiveFolderId(folderId);
    setActiveSection('all');
    setCheckedIds(new Set());
  }

  function handleSortChange(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'title' ? 'asc' : 'desc');
    }
  }

  function handleToggleCheck(docId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  }

  function handleToggleCheckAll() {
    const allChecked =
      visibleDocuments.length > 0 && visibleDocuments.every((d) => checkedIds.has(d.id));
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(visibleDocuments.map((d) => d.id)));
    }
  }

  function handleUploadSubmit(payload: UploadSubmission) {
    if (!currentUser) return;
    const targetFolder = foldersById[payload.folderId] ?? folders[0];
    const now = new Date().toISOString();

    const highestSeq = documents.reduce((max, doc) => {
      const match = doc.recordId.match(/(\d+)$/);
      const num = match ? parseInt(match[1], 10) : 100;
      return Math.max(max, num);
    }, 142);

    const newDocs: DocumentRecord[] = payload.items.map((item, idx) => {
      const seq = String(highestSeq + idx + 1).padStart(4, '0');
      const recordId = `DOC-2026-${seq}`;
      const category = detectFileCategory(item.fileName, item.mimeType);
      const ext = getExtension(item.fileName);
      const slugFolder = (targetFolder?.name ?? 'general')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const blobUrl = item.file ? URL.createObjectURL(item.file) : undefined;

      return {
        id: `doc-${Date.now()}-${idx}`,
        recordId,
        title: item.title,
        fileName: item.fileName,
        extension: ext,
        fileCategory: category,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        folderId: targetFolder?.id ?? folders[0].id,
        department: targetFolder?.department ?? currentUser.department,
        ownerId: currentUser.id,
        workstationOrigin: currentUser.workstationId,
        accessScope: payload.accessScope,
        sharedWith: [],
        tags: payload.tags,
        description:
          payload.description ||
          `Uploaded from ${currentUser.workstationId} into ${targetFolder?.name ?? 'Central Repository'}.`,
        uploadedAt: now,
        updatedAt: now,
        retrievalCount: 0,
        isStarred: false,
        isTrashed: false,
        checksum: generateChecksum(`${recordId}-${item.fileName}-${item.sizeBytes}`),
        storagePath: `/central/${slugFolder}/2026/${item.fileName}`,
        blobUrl,
        rawTextContent: item.rawTextContent,
        previewSections:
          !blobUrl && !item.rawTextContent
            ? [
                {
                  heading: 'Central Repository Record',
                  body:
                    payload.description ||
                    `Digital file "${item.fileName}" stored centrally in ${targetFolder?.name ?? 'Central Repository'} by ${currentUser.fullName} (${currentUser.workstationId}).`,
                },
              ]
            : undefined,
      };
    });

    setDocuments((prev) => [...newDocs, ...prev]);

    for (const d of newDocs) {
      appendActivity(
        'uploaded',
        d.title,
        `Stored ${formatBytes(d.sizeBytes)} ${d.extension} into ${targetFolder?.name ?? d.department}`,
        d.recordId
      );
    }

    if (newDocs.length === 1) {
      setSelectedDocId(newDocs[0].id);
      showToast(`Stored "${newDocs[0].title}" (${newDocs[0].recordId}) in central repository.`);
    } else {
      showToast(`Stored ${newDocs.length} documents in ${targetFolder?.name ?? 'central repository'}.`);
    }
  }

  function handleDownload(doc: DocumentRecord) {
    const owner = usersById[doc.ownerId];
    triggerDocumentDownload(doc, owner?.fullName ?? 'Authorized Staff');
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? { ...d, retrievalCount: d.retrievalCount + 1, lastRetrievedAt: now }
          : d
      )
    );
    appendActivity(
      'retrieved',
      doc.title,
      `Retrieved read-only copy (${formatBytes(doc.sizeBytes)})`,
      doc.recordId
    );
    showToast(`Retrieved "${doc.fileName}" from central server.`);
  }

  function handleSaveAccess(docId: string, scope: AccessScope, grants: ShareGrant[]) {
    const target = documents.find((d) => d.id === docId);
    if (!target) return;
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, accessScope: scope, sharedWith: grants, updatedAt: now } : d
      )
    );
    appendActivity(
      'shared',
      target.title,
      `Updated access policy to ${scope} (${grants.length} direct ${grants.length === 1 ? 'grant' : 'grants'})`,
      target.recordId
    );
    showToast(`Updated shared access settings for "${target.title}".`);
  }

  function handleSaveOrganize(
    docId: string,
    updates: { title: string; folderId: string; tags: string[]; description: string }
  ) {
    const target = documents.find((d) => d.id === docId);
    const nextFolder = foldersById[updates.folderId];
    if (!target || !nextFolder) return;
    const now = new Date().toISOString();
    const slugFolder = nextFolder.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              title: updates.title,
              folderId: updates.folderId,
              department: nextFolder.department,
              tags: updates.tags,
              description: updates.description,
              storagePath: `/central/${slugFolder}/2026/${d.fileName}`,
              updatedAt: now,
            }
          : d
      )
    );
    appendActivity(
      'organized',
      updates.title,
      `Filed in ${nextFolder.name} with ${updates.tags.length} search keywords`,
      target.recordId
    );
    showToast(`Updated record organization for "${updates.title}".`);
  }

  function handleBulkMove(folderId: string) {
    if (!currentUser) return;
    const targetFolder = foldersById[folderId];
    if (!targetFolder) return;
    const movableIds = new Set(
      documents
        .filter((d) => checkedIds.has(d.id) && canUserManageDocument(d, currentUser))
        .map((d) => d.id)
    );
    if (movableIds.size === 0) {
      showToast('None of the selected records can be moved with your current permissions.', 'info');
      return;
    }
    const now = new Date().toISOString();
    const slugFolder = targetFolder.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    setDocuments((prev) =>
      prev.map((d) =>
        movableIds.has(d.id)
          ? {
              ...d,
              folderId,
              department: targetFolder.department,
              storagePath: `/central/${slugFolder}/2026/${d.fileName}`,
              updatedAt: now,
            }
          : d
      )
    );
    appendActivity(
      'organized',
      `${movableIds.size} documents`,
      `Moved ${movableIds.size} selected records to ${targetFolder.name}`
    );
    setCheckedIds(new Set());
    showToast(`Moved ${movableIds.size} records into "${targetFolder.name}".`);
  }

  function handleToggleStar(docId: string) {
    const target = documents.find((d) => d.id === docId);
    if (!target) return;
    const nextStar = !target.isStarred;
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isStarred: nextStar } : d))
    );
    if (nextStar) {
      appendActivity('starred', target.title, 'Bookmarked record for quick retrieval', target.recordId);
    }
  }

  function handleTrash(docId: string) {
    const target = documents.find((d) => d.id === docId);
    if (!target) return;
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isTrashed: true, trashedAt: now } : d))
    );
    if (selectedDocId === docId) setSelectedDocId(null);
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
    appendActivity('trashed', target.title, 'Moved record to Trash', target.recordId);
    showToast(`Moved "${target.title}" to Trash.`, 'info');
  }

  function handleRestore(docId: string) {
    const target = documents.find((d) => d.id === docId);
    if (!target) return;
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isTrashed: false, trashedAt: undefined } : d))
    );
    appendActivity('restored', target.title, 'Restored record from Trash to repository', target.recordId);
    showToast(`Restored "${target.title}" to active repository.`);
  }

  function handlePermanentDelete(docId: string) {
    const target = documents.find((d) => d.id === docId);
    if (!target) return;
    if (target.blobUrl) URL.revokeObjectURL(target.blobUrl);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (selectedDocId === docId) setSelectedDocId(null);
    showToast(`Permanently removed "${target.title}" from central server.`, 'info');
  }

  function handleBulkDownload() {
    const chosen = visibleDocuments.filter((d) => checkedIds.has(d.id));
    if (chosen.length === 0) return;
    chosen.slice(0, 5).forEach((doc) => handleDownload(doc));
    setCheckedIds(new Set());
  }

  function handleBulkTrashOrRestore() {
    if (!currentUser) return;
    const isTrash = activeSection === 'trash' && !activeFolderId;
    const affected = visibleDocuments.filter(
      (d) => checkedIds.has(d.id) && canUserManageDocument(d, currentUser)
    );
    if (affected.length === 0) {
      showToast('No selected records allow this action with your current role.', 'info');
      return;
    }
    const ids = new Set(affected.map((d) => d.id));
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((d) =>
        ids.has(d.id)
          ? { ...d, isTrashed: !isTrash, trashedAt: isTrash ? undefined : now }
          : d
      )
    );
    setCheckedIds(new Set());
    showToast(
      isTrash
        ? `Restored ${affected.length} records to repository.`
        : `Moved ${affected.length} records to Trash.`,
      isTrash ? 'success' : 'info'
    );
  }

  function handleCreateFolder(name: string, department: string, description: string) {
    if (!currentUser) return;
    const newFolder: FolderItem = {
      id: `fld-${Date.now()}`,
      name,
      department,
      description: description || `Central repository folder for ${department}.`,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
    appendActivity('folder_created', name, `Created central folder under ${department}`);
    setActiveFolderId(newFolder.id);
    setActiveSection('all');
    showToast(`Created central folder "${name}".`);
  }

  function handleSwitchUser(userId: string) {
    const nextUser = users.find((u) => u.id === userId);
    if (!nextUser) return;
    setIsSwitchingView(true);
    setCurrentUserId(userId);
    setSelectedDocId(null);
    setCheckedIds(new Set());
    window.setTimeout(() => setIsSwitchingView(false), 180);
    showToast(
      `Switched workstation session to ${nextUser.fullName} (${nextUser.role}).`,
      'info'
    );
  }

  function handleAddUser(
    input: Omit<UserAccount, 'id' | 'initials' | 'lastActiveAt' | 'status'>
  ) {
    const initials = input.fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
    const newUser: UserAccount = {
      ...input,
      id: `usr-${Date.now()}`,
      initials: initials || 'US',
      status: 'Active',
      lastActiveAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    appendActivity(
      'user_updated',
      newUser.fullName,
      `Authorized new ${newUser.role} account on workstation ${newUser.workstationId}`
    );
    showToast(`Authorized ${newUser.fullName} (${newUser.workstationId}).`);
  }

  function handleToggleUserStatus(userId: string) {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Suspended' : 'Active';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );
    appendActivity(
      'user_updated',
      target.fullName,
      `Changed account authorization status to ${nextStatus}`
    );
    showToast(`${target.fullName} status changed to ${nextStatus}.`, 'info');
  }

  function handleUpdateUserRole(userId: string, role: UserRole) {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    appendActivity('user_updated', target.fullName, `Updated role to ${role}`);
    showToast(`Updated ${target.fullName} to ${role}.`);
  }

  function handleInspectByRecordId(recordId: string) {
    const match = accessibleDocuments.find((d) => d.recordId === recordId);
    if (!match) {
      showToast('You do not have access to inspect this record, or it was removed.', 'info');
      return;
    }
    setActiveFolderId(null);
    setActiveSection(match.isTrashed ? 'trash' : 'all');
    setSelectedDocId(match.id);
  }

  // Signed-out workstation login screen
  if (!currentUser) {
    return (
      <SignInScreen
        users={users}
        onSignIn={(userId) => {
          setCurrentUserId(userId);
          setActiveSection('all');
          setActiveFolderId(null);
        }}
      />
    );
  }

  const activeFolder = activeFolderId ? foldersById[activeFolderId] : null;
  const isTrashView = activeSection === 'trash' && !activeFolderId;
  const isDocumentView = activeSection !== 'activity' && activeSection !== 'users';

  let breadcrumbCurrent = 'All Documents';
  let pageHeading = 'Central Document Repository';
  let pageSubheading =
    'All digital records accessible from your authorized workstation across connected office departments.';

  if (activeFolder) {
    breadcrumbCurrent = activeFolder.name;
    pageHeading = activeFolder.name;
    pageSubheading = activeFolder.description;
  } else if (activeSection === 'shared') {
    breadcrumbCurrent = 'Shared Access';
    pageHeading = 'Shared Documents';
    pageSubheading =
      'Files shared across departments and authorized computers through the central server.';
  } else if (activeSection === 'recent') {
    breadcrumbCurrent = 'Recent Retrievals';
    pageHeading = 'Recently Retrieved Records';
    pageSubheading = 'Documents recently opened or downloaded across active workstations.';
  } else if (activeSection === 'starred') {
    breadcrumbCurrent = 'Starred Records';
    pageHeading = 'Starred Documents';
    pageSubheading = 'Bookmarked files pinned for fast lookup and recurring reference.';
  } else if (activeSection === 'trash') {
    breadcrumbCurrent = 'Trash';
    pageHeading = 'Repository Trash';
    pageSubheading =
      'Removed records held before permanent deletion. Authorized owners and administrators can restore files at any time.';
  } else if (activeSection === 'activity') {
    breadcrumbCurrent = 'Activity Log';
  } else if (activeSection === 'users') {
    breadcrumbCurrent = 'Authorized Users';
  }

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || categoryFilter !== 'all' || scopeFilter !== 'all';

  const emptyTitle = hasActiveFilters
    ? 'No matching documents found'
    : isTrashView
      ? 'Trash is empty'
      : activeFolder
        ? `No documents filed in ${activeFolder.name}`
        : 'No documents in this view';

  const emptyDescription = hasActiveFilters
    ? 'Adjust your search keywords, file type filter, or access scope to broaden results.'
    : isTrashView
      ? 'Deleted documents will appear here before permanent removal from the central repository.'
      : 'Upload a digital record from your computer to store it centrally for authorized retrieval.';

  const categoryTabs: Array<{ id: FileCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All Types' },
    { id: 'pdf', label: 'PDF' },
    { id: 'document', label: 'Documents' },
    { id: 'spreadsheet', label: 'Spreadsheets' },
    { id: 'presentation', label: 'Slides' },
    { id: 'image', label: 'Images' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeSection={activeSection}
        activeFolderId={activeFolderId}
        folders={folders}
        folderCounts={folderCounts}
        sectionCounts={sectionCounts}
        totalStorageBytes={totalStorageBytes}
        currentUser={currentUser}
        users={users}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectSection={handleSelectSection}
        onSelectFolder={handleSelectFolder}
        onOpenNewFolder={() => setIsNewFolderOpen(true)}
        onSwitchUser={handleSwitchUser}
        onSignOut={() => {
          setCurrentUserId(null);
          setSelectedDocId(null);
        }}
      />

      {/* Right Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          breadcrumbRoot="Central Repository"
          breadcrumbCurrent={breadcrumbCurrent}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onResetToRoot={() => handleSelectSection('all')}
        />

        <div className="flex-1 flex min-w-0">
          {/* Primary Content Viewport */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 space-y-6">
            {isDocumentView ? (
              <>
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <h1 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                      {pageHeading}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
                      {pageSubheading}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
                    Showing {visibleDocuments.length}{' '}
                    {visibleDocuments.length === 1 ? 'record' : 'records'}
                  </div>
                </div>

                {/* Single-Elevation Horizontal Summary Strip (All Documents root view) */}
                {activeSection === 'all' && !activeFolder && (
                  <section
                    aria-label="Repository overview metrics"
                    className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-200"
                  >
                    <div className="px-5 py-4">
                      <div className="text-xs font-medium text-slate-500">Accessible Records</div>
                      <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
                        {activeAccessibleDocs.length}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Indexed in central database
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="text-xs font-medium text-slate-500">Shared Across Staff</div>
                      <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
                        {sectionCounts.shared}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Multi-workstation access enabled
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="text-xs font-medium text-slate-500">Central Folders</div>
                      <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
                        {folders.length}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Structured by department
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="text-xs font-medium text-slate-500">
                        Storage & Retrievals
                      </div>
                      <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
                        {formatBytes(totalStorageBytes)}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        {totalRetrievals} logged file retrievals
                      </div>
                    </div>
                  </section>
                )}

                {/* Filter, Scope, and View Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Segmented File Type Filter */}
                  <div
                    role="tablist"
                    aria-label="Filter by file category"
                    className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md overflow-x-auto max-w-full"
                  >
                    {categoryTabs.map((tab) => {
                      const active = categoryFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setCategoryFilter(tab.id)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Controls: Access Scope Filter + Reset + View Mode */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                          setScopeFilter('all');
                        }}
                        className="text-xs font-medium text-[#0B3D91] hover:underline whitespace-nowrap"
                      >
                        Reset filters
                      </button>
                    )}

                    <select
                      value={scopeFilter}
                      onChange={(e) => setScopeFilter(e.target.value as AccessScope | 'all')}
                      aria-label="Filter by access policy"
                      className="h-9 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:border-[#0B3D91] focus:outline-none"
                    >
                      <option value="all">All Access Scopes</option>
                      <option value="organization">Organization-Wide</option>
                      <option value="department">Department Only</option>
                      <option value="restricted">Restricted</option>
                    </select>

                    <div className="inline-flex items-center p-0.5 rounded-md border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        aria-label="Table list view"
                        aria-pressed={viewMode === 'table'}
                        className={`p-1.5 rounded transition-colors ${
                          viewMode === 'table'
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        aria-label="Tile grid view"
                        aria-pressed={viewMode === 'grid'}
                        className={`p-1.5 rounded transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contextual Bulk Selection Toolbar */}
                {checkedIds.size > 0 && (
                  <div className="px-4 py-2.5 rounded-md bg-[#062152] text-white flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="font-medium tabular-nums">
                      {checkedIds.size} {checkedIds.size === 1 ? 'record' : 'records'} selected
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      {!isTrashView && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsBulkMoveOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
                          >
                            <FolderInput className="w-3.5 h-3.5" />
                            <span>Move to Folder</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkDownload}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Retrieve Selected</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={handleBulkTrashOrRestore}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
                      >
                        {isTrashView ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore Selected</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Move to Trash</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckedIds(new Set())}
                        aria-label="Clear selection"
                        className="p-1.5 rounded hover:bg-white/15 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Document Data Grid or Tile Grid */}
                {viewMode === 'table' ? (
                  <DocumentTable
                    documents={visibleDocuments}
                    foldersById={foldersById}
                    usersById={usersById}
                    currentUser={currentUser}
                    selectedDocId={selectedDocId}
                    checkedIds={checkedIds}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    isTrashView={isTrashView}
                    isLoading={isSwitchingView}
                    isCompact={Boolean(selectedDocument)}
                    emptyTitle={emptyTitle}
                    emptyDescription={emptyDescription}
                    showUploadCtaInEmpty={!hasActiveFilters && !isTrashView}
                    onSelectDocument={(id) =>
                      setSelectedDocId((prev) => (prev === id ? null : id))
                    }
                    onToggleCheck={handleToggleCheck}
                    onToggleCheckAll={handleToggleCheckAll}
                    onSortChange={handleSortChange}
                    onDownload={handleDownload}
                    onShare={(doc) => setShareDocId(doc.id)}
                    onOrganize={(doc) => setOrganizeDocId(doc.id)}
                    onToggleStar={handleToggleStar}
                    onTrash={handleTrash}
                    onRestore={handleRestore}
                    onPermanentDelete={handlePermanentDelete}
                    onOpenUpload={() => setIsUploadOpen(true)}
                  />
                ) : (
                  <DocumentGrid
                    documents={visibleDocuments}
                    foldersById={foldersById}
                    usersById={usersById}
                    selectedDocId={selectedDocId}
                    isTrashView={isTrashView}
                    emptyTitle={emptyTitle}
                    emptyDescription={emptyDescription}
                    showUploadCtaInEmpty={!hasActiveFilters && !isTrashView}
                    onSelectDocument={(id) =>
                      setSelectedDocId((prev) => (prev === id ? null : id))
                    }
                    onDownload={handleDownload}
                    onShare={(doc) => setShareDocId(doc.id)}
                    onToggleStar={handleToggleStar}
                    onRestore={handleRestore}
                    onOpenUpload={() => setIsUploadOpen(true)}
                  />
                )}
              </>
            ) : activeSection === 'activity' ? (
              <ActivityLogView
                activities={activities}
                usersById={usersById}
                searchQuery={searchQuery}
                onInspectByRecordId={handleInspectByRecordId}
              />
            ) : (
              <UsersView
                users={users}
                documents={documents}
                currentUser={currentUser}
                searchQuery={searchQuery}
                onSwitchUser={handleSwitchUser}
                onAddUser={handleAddUser}
                onToggleUserStatus={handleToggleUserStatus}
                onUpdateUserRole={handleUpdateUserRole}
              />
            )}
          </main>

          {/* Right Slide-in Read-Only Document Inspector */}
          {selectedDocument && isDocumentView && (
            <DocumentInspector
              document={selectedDocument}
              folder={foldersById[selectedDocument.folderId]}
              owner={usersById[selectedDocument.ownerId]}
              usersById={usersById}
              currentUser={currentUser}
              documentActivities={selectedDocActivities}
              onClose={() => setSelectedDocId(null)}
              onDownload={handleDownload}
              onShare={(doc) => setShareDocId(doc.id)}
              onOrganize={(doc) => setOrganizeDocId(doc.id)}
              onToggleStar={handleToggleStar}
              onTrash={handleTrash}
              onRestore={handleRestore}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        folders={folders}
        defaultFolderId={activeFolderId ?? folders[0]?.id ?? ''}
        currentUser={currentUser}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleUploadSubmit}
      />

      <ShareModal
        document={shareDocument}
        users={users}
        currentUser={currentUser}
        onClose={() => setShareDocId(null)}
        onSaveAccess={handleSaveAccess}
      />

      <OrganizeModal
        document={organizeDocument}
        bulkCount={isBulkMoveOpen ? checkedIds.size : 0}
        isOpen={Boolean(organizeDocument) || isBulkMoveOpen}
        folders={folders}
        onClose={() => {
          setOrganizeDocId(null);
          setIsBulkMoveOpen(false);
        }}
        onSaveSingle={handleSaveOrganize}
        onSaveBulkMove={handleBulkMove}
      />

      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* Subtle Action Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2.5 text-xs font-medium"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          )}
          <span className="leading-snug">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-1 p-0.5 text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
