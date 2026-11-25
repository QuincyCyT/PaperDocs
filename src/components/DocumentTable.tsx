import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FolderInput,
  Globe,
  Building2,
  Lock,
  RotateCcw,
  Share2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  AccessScope,
  DocumentRecord,
  FolderItem,
  SortDirection,
  SortField,
  UserAccount,
} from '../types/dms';
import {
  canUserManageDocument,
  formatBytes,
  formatDateTime,
  getAccessScopeLabel,
} from '../utils/formatters';
import { FileTypeIcon } from './FileTypeIcon';

interface DocumentTableProps {
  documents: DocumentRecord[];
  foldersById: Record<string, FolderItem>;
  usersById: Record<string, UserAccount>;
  currentUser: UserAccount;
  selectedDocId: string | null;
  checkedIds: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  isTrashView: boolean;
  isLoading: boolean;
  isCompact?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  showUploadCtaInEmpty: boolean;
  onSelectDocument: (docId: string) => void;
  onToggleCheck: (docId: string) => void;
  onToggleCheckAll: () => void;
  onSortChange: (field: SortField) => void;
  onDownload: (doc: DocumentRecord) => void;
  onShare: (doc: DocumentRecord) => void;
  onOrganize: (doc: DocumentRecord) => void;
  onToggleStar: (docId: string) => void;
  onTrash: (docId: string) => void;
  onRestore: (docId: string) => void;
  onPermanentDelete: (docId: string) => void;
  onOpenUpload: () => void;
}

function ScopeIndicator({ scope }: { scope: AccessScope }) {
  const Icon = scope === 'organization' ? Globe : scope === 'department' ? Building2 : Lock;
  const colorClass =
    scope === 'restricted'
      ? 'text-amber-800'
      : scope === 'department'
        ? 'text-slate-700'
        : 'text-slate-600';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${colorClass} whitespace-nowrap`}>
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
      <span>{getAccessScopeLabel(scope)}</span>
    </span>
  );
}

function SortIcon({
  field,
  activeField,
  direction,
}: {
  field: SortField;
  activeField: SortField;
  direction: SortDirection;
}) {
  if (field !== activeField) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />;
  }
  return direction === 'asc' ? (
    <ArrowUp className="w-3.5 h-3.5 text-[#0B3D91]" aria-hidden="true" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-[#0B3D91]" aria-hidden="true" />
  );
}

export function DocumentTable({
  documents,
  foldersById,
  usersById,
  currentUser,
  selectedDocId,
  checkedIds,
  sortField,
  sortDirection,
  isTrashView,
  isLoading,
  isCompact = false,
  emptyTitle,
  emptyDescription,
  showUploadCtaInEmpty,
  onSelectDocument,
  onToggleCheck,
  onToggleCheckAll,
  onSortChange,
  onDownload,
  onShare,
  onOrganize,
  onToggleStar,
  onTrash,
  onRestore,
  onPermanentDelete,
  onOpenUpload,
}: DocumentTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-14 px-4 flex items-center gap-4 animate-pulse">
              <div className="w-4 h-4 bg-slate-200 rounded" />
              <div className="w-28 h-3.5 bg-slate-200 rounded" />
              <div className="flex-1 h-3.5 bg-slate-200 rounded max-w-md" />
              <div className="w-16 h-3.5 bg-slate-100 rounded" />
              <div className="w-24 h-3.5 bg-slate-100 rounded hidden md:block" />
              <div className="w-28 h-3.5 bg-slate-100 rounded hidden lg:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-6 py-16 text-center">
        <div className="mx-auto max-w-md space-y-2">
          <h3 className="font-display text-base font-semibold text-slate-900">
            {emptyTitle}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">{emptyDescription}</p>
          {showUploadCtaInEmpty && (
            <div className="pt-3">
              <button
                type="button"
                onClick={onOpenUpload}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[#0B3D91] hover:bg-[#093074] text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                <span>Upload First Document</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const allChecked = documents.length > 0 && documents.every((d) => checkedIds.has(d.id));

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[12px] font-semibold text-slate-600">
              <th className="w-10 py-2.5 pl-4 pr-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleCheckAll}
                  aria-label="Select all visible documents"
                  className="w-4 h-4 rounded border-slate-300 accent-[#0B3D91] cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSortChange('recordId')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                >
                  <span>Record ID</span>
                  <SortIcon field="recordId" activeField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSortChange('title')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                >
                  <span>Document</span>
                  <SortIcon field="title" activeField={sortField} direction={sortDirection} />
                </button>
              </th>
              {!isCompact && (
                <th className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap">Owner</th>
              )}
              <th className="py-2.5 px-3 hidden sm:table-cell whitespace-nowrap">Access</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSortChange('sizeBytes')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors ml-auto"
                >
                  <span>Size</span>
                  <SortIcon field="sizeBytes" activeField={sortField} direction={sortDirection} />
                </button>
              </th>
              {!isCompact && (
                <th className="py-2.5 px-3 hidden xl:table-cell whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSortChange('updatedAt')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    <span>Last Updated</span>
                    <SortIcon field="updatedAt" activeField={sortField} direction={sortDirection} />
                  </button>
                </th>
              )}
              <th className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13.5px]">
            {documents.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              const isChecked = checkedIds.has(doc.id);
              const folder = foldersById[doc.folderId];
              const owner = usersById[doc.ownerId];
              const canManage = canUserManageDocument(doc, currentUser);

              return (
                <tr
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#0B3D91]/[0.06]'
                      : 'hover:bg-slate-50/90'
                  }`}
                >
                  <td
                    className="py-3 pl-4 pr-2 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCheck(doc.id)}
                      aria-label={`Select ${doc.title}`}
                      className="w-4 h-4 rounded border-slate-300 accent-[#0B3D91] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-3 align-middle whitespace-nowrap">
                    <span className="font-mono text-[12px] text-slate-600 tabular-nums">
                      {doc.recordId}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-middle min-w-[240px] max-w-[420px]">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        <FileTypeIcon category={doc.fileCategory} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 truncate">
                            {doc.title}
                          </span>
                          {doc.isStarred && !isTrashView && (
                            <Star
                              className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0"
                              aria-label="Starred"
                            />
                          )}
                        </div>
                        <div className="text-[12px] text-slate-500 truncate mt-0.5">
                          <span>{doc.extension}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{folder?.name ?? doc.department}</span>
                          {doc.tags.length > 0 && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span>{doc.tags.slice(0, 2).join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {!isCompact && (
                    <td className="py-3 px-3 align-middle hidden md:table-cell whitespace-nowrap">
                      <div className="text-[13px] text-slate-800">{owner?.fullName ?? 'Unknown'}</div>
                      <div className="text-[11.5px] font-mono text-slate-400">
                        {doc.workstationOrigin}
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-3 align-middle hidden sm:table-cell whitespace-nowrap">
                    <ScopeIndicator scope={doc.accessScope} />
                    {doc.sharedWith.length > 0 && (
                      <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        +{doc.sharedWith.length} direct{' '}
                        {doc.sharedWith.length === 1 ? 'grant' : 'grants'}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 align-middle text-right font-mono text-[12.5px] text-slate-700 tabular-nums whitespace-nowrap">
                    {formatBytes(doc.sizeBytes)}
                  </td>
                  {!isCompact && (
                    <td className="py-3 px-3 align-middle hidden xl:table-cell font-mono text-[12px] text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDateTime(doc.updatedAt)}
                    </td>
                  )}
                  <td
                    className="py-3 pl-2 pr-4 align-middle text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isTrashView ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onRestore(doc.id)}
                          disabled={!canManage}
                          title="Restore to repository"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-[#0B3D91] hover:bg-[#0B3D91]/10 disabled:opacity-40 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onPermanentDelete(doc.id)}
                          disabled={!canManage}
                          title="Delete permanently"
                          className="p-1.5 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-40 transition-colors"
                          aria-label={`Permanently delete ${doc.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onDownload(doc)}
                          title="Retrieve / Download copy"
                          aria-label={`Download ${doc.title}`}
                          className="p-1.5 rounded text-slate-500 hover:text-[#0B3D91] hover:bg-slate-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onShare(doc)}
                          title="Manage shared access"
                          aria-label={`Share ${doc.title}`}
                          className="p-1.5 rounded text-slate-500 hover:text-[#0B3D91] hover:bg-slate-100 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStar(doc.id)}
                          title={doc.isStarred ? 'Remove star' : 'Star record'}
                          aria-label={doc.isStarred ? `Unstar ${doc.title}` : `Star ${doc.title}`}
                          className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                            doc.isStarred
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-500' : ''}`}
                          />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => onOrganize(doc)}
                              title="Organize / Edit details"
                              aria-label={`Organize ${doc.title}`}
                              className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <FolderInput className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onTrash(doc.id)}
                              title="Move to Trash"
                              aria-label={`Move ${doc.title} to trash`}
                              className="p-1.5 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
