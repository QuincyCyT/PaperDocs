import {
  X,
  Download,
  Share2,
  FolderInput,
  Star,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Lock,
  Building2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import type {
  ActivityEntry,
  DocumentRecord,
  FolderItem,
  UserAccount,
} from '../types/dms';
import {
  canUserManageDocument,
  formatBytes,
  formatDateTime,
  getAccessScopeLabel,
} from '../utils/formatters';
import { FileTypeIcon } from './FileTypeIcon';

interface DocumentInspectorProps {
  document: DocumentRecord | null;
  folder: FolderItem | undefined;
  owner: UserAccount | undefined;
  usersById: Record<string, UserAccount>;
  currentUser: UserAccount;
  documentActivities: ActivityEntry[];
  onClose: () => void;
  onDownload: (doc: DocumentRecord) => void;
  onShare: (doc: DocumentRecord) => void;
  onOrganize: (doc: DocumentRecord) => void;
  onToggleStar: (docId: string) => void;
  onTrash: (docId: string) => void;
  onRestore: (docId: string) => void;
}

export function DocumentInspector({
  document: doc,
  folder,
  owner,
  usersById,
  currentUser,
  documentActivities,
  onClose,
  onDownload,
  onShare,
  onOrganize,
  onToggleStar,
  onTrash,
  onRestore,
}: DocumentInspectorProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!doc) return null;

  const canManage = canUserManageDocument(doc, currentUser);
  const internalLink = `paperlesslink://central/${doc.recordId}`;

  function handleCopyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(internalLink).catch(() => {});
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1800);
  }

  const ScopeIcon =
    doc.accessScope === 'organization'
      ? Globe
      : doc.accessScope === 'department'
        ? Building2
        : Lock;

  return (
    <aside
      aria-label="Document inspector and read-only preview"
      className="fixed inset-y-0 right-0 z-30 w-full sm:w-[440px] bg-white border-l border-slate-200 flex flex-col shadow-xl lg:shadow-none lg:static lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 shrink-0"
    >
      {/* Inspector Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileTypeIcon category={doc.fileCategory} className="w-4 h-4 shrink-0" />
            <span className="font-mono tabular-nums">{doc.recordId}</span>
            <span aria-hidden="true">·</span>
            <span>{doc.extension}</span>
          </div>
          <h2 className="mt-1 font-display text-[16px] font-bold text-slate-900 leading-snug break-words">
            {doc.title}
          </h2>
          <p className="mt-0.5 text-xs font-mono text-slate-500 truncate">{doc.fileName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close document inspector"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
        {/* Primary Action Strip */}
        <div className="px-5 py-3.5 flex flex-wrap items-center gap-2 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={() => onDownload(doc)}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md bg-[#0B3D91] hover:bg-[#093074] text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Retrieve File</span>
          </button>

          {!doc.isTrashed ? (
            <>
              <button
                type="button"
                onClick={() => onShare(doc)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => onOrganize(doc)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                  <span>Organize</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleStar(doc.id)}
                aria-label={doc.isStarred ? 'Remove star' : 'Star record'}
                className={`h-9 w-9 inline-flex items-center justify-center rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors ${
                  doc.isStarred ? 'text-amber-500' : 'text-slate-500'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${doc.isStarred ? 'fill-amber-500' : ''}`} />
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => onTrash(doc.id)}
                  aria-label="Move to trash"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => onRestore(doc.id)}
              disabled={!canManage}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[#0B3D91] text-xs font-medium disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Record</span>
            </button>
          )}
        </div>

        {/* Read-Only Document Preview Sheet */}
        <section className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">Read-Only Preview</h3>
            <span className="text-[11.5px] text-slate-500">Central Repository Copy</span>
          </div>

          <div className="rounded-md border border-slate-200 bg-[#F8FAFC] overflow-hidden">
            {doc.blobUrl && doc.fileCategory === 'image' ? (
              <div className="p-3 bg-white flex flex-col items-center">
                <img
                  src={doc.blobUrl}
                  alt={doc.title}
                  className="max-h-64 w-auto object-contain rounded"
                />
              </div>
            ) : doc.blobUrl && doc.fileCategory === 'pdf' ? (
              <div className="bg-white">
                <iframe
                  src={doc.blobUrl}
                  title={`Preview of ${doc.title}`}
                  className="w-full h-64 border-0"
                />
                <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Embedded PDF preview</span>
                  <a
                    href={doc.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0B3D91] font-medium hover:underline"
                  >
                    <span>Open full view</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : doc.rawTextContent ? (
              <pre className="p-4 text-[12px] font-mono text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed bg-white">
                {doc.rawTextContent}
              </pre>
            ) : (
              <div className="p-4 bg-white space-y-3.5 max-h-72 overflow-y-auto">
                <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{doc.department}</span>
                  <span className="font-mono tabular-nums">{doc.recordId}</span>
                </div>
                {doc.previewSections && doc.previewSections.length > 0 ? (
                  doc.previewSections.map((sec, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[12px] font-semibold text-slate-900">
                        {sec.heading}
                      </div>
                      <p className="text-[12.5px] text-slate-600 leading-relaxed">{sec.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">{doc.description}</p>
                )}
              </div>
            )}
          </div>

          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            Editing and electronic signing are outside PaperlessLink scope. Retrieve a local copy to
            revise and upload a new record if needed.
          </p>
        </section>

        {/* Summary & Tags */}
        <section className="px-5 py-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-900">Record Notes</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {doc.description || 'No description recorded for this document.'}
          </p>
          {doc.tags.length > 0 && (
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Keywords: </span>
              <span>{doc.tags.join(' · ')}</span>
            </div>
          )}
        </section>

        {/* Metadata Ledger */}
        <section className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">Central Storage Details</h3>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0B3D91] hover:text-[#093074] transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Record Link</span>
                </>
              )}
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
            <div>
              <dt className="text-slate-500 text-[11.5px]">Folder</dt>
              <dd className="font-medium text-slate-900 truncate">
                {folder?.name ?? doc.department}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 text-[11.5px]">File Size</dt>
              <dd className="font-mono text-slate-900 tabular-nums">
                {formatBytes(doc.sizeBytes)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 text-[11.5px]">Uploaded By</dt>
              <dd className="font-medium text-slate-900 truncate">
                {owner?.fullName ?? 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 text-[11.5px]">Workstation Origin</dt>
              <dd className="font-mono text-slate-900">{doc.workstationOrigin}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-[11.5px]">Uploaded</dt>
              <dd className="font-mono text-slate-700 tabular-nums">
                {formatDateTime(doc.uploadedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 text-[11.5px]">Retrievals</dt>
              <dd className="font-mono text-slate-900 tabular-nums">
                {doc.retrievalCount} {doc.retrievalCount === 1 ? 'download' : 'downloads'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500 text-[11.5px]">Central Server Path</dt>
              <dd className="font-mono text-[11.5px] text-slate-700 break-all mt-0.5">
                {doc.storagePath}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500 text-[11.5px]">Integrity Hash</dt>
              <dd className="font-mono text-[11.5px] text-slate-500 break-all mt-0.5">
                {doc.checksum}
              </dd>
            </div>
          </dl>
        </section>

        {/* Shared Access Summary */}
        <section className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">Authorized Access</h3>
            {!doc.isTrashed && (
              <button
                type="button"
                onClick={() => onShare(doc)}
                className="text-xs font-medium text-[#0B3D91] hover:underline"
              >
                Manage Access
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-800">
            <ScopeIcon className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-medium">{getAccessScopeLabel(doc.accessScope)}</span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {doc.accessScope === 'organization'
                ? 'All active authorized personnel'
                : doc.accessScope === 'department'
                  ? `${doc.department} workstations`
                  : 'Explicitly listed users only'}
            </span>
          </div>
          {doc.sharedWith.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {doc.sharedWith.map((grant) => {
                const user = usersById[grant.userId];
                if (!user) return null;
                return (
                  <li
                    key={grant.userId}
                    className="flex items-center justify-between text-xs text-slate-700"
                  >
                    <span className="truncate">
                      {user.fullName}{' '}
                      <span className="text-slate-400">({user.workstationId})</span>
                    </span>
                    <span className="text-slate-500 shrink-0 ml-2">
                      {grant.permission === 'organize' ? 'Organize & View' : 'View Only'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Record History */}
        <section className="px-5 py-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-900">Recent Record Activity</h3>
          {documentActivities.length === 0 ? (
            <p className="text-xs text-slate-500">No logged activity for this document yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {documentActivities.slice(0, 6).map((act) => {
                const actor = usersById[act.actorId];
                return (
                  <li key={act.id} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800 truncate">
                        {actor?.fullName ?? 'System'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                        {formatDateTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-500">{act.details}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}
