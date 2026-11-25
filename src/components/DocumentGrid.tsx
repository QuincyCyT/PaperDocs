import { Download, Share2, Star, Upload, RotateCcw } from 'lucide-react';
import type { DocumentRecord, FolderItem, UserAccount } from '../types/dms';
import {
  formatBytes,
  formatShortDate,
  getAccessScopeLabel,
} from '../utils/formatters';
import { FileTypeIcon } from './FileTypeIcon';

interface DocumentGridProps {
  documents: DocumentRecord[];
  foldersById: Record<string, FolderItem>;
  usersById: Record<string, UserAccount>;
  selectedDocId: string | null;
  isTrashView: boolean;
  emptyTitle: string;
  emptyDescription: string;
  showUploadCtaInEmpty: boolean;
  onSelectDocument: (docId: string) => void;
  onDownload: (doc: DocumentRecord) => void;
  onShare: (doc: DocumentRecord) => void;
  onToggleStar: (docId: string) => void;
  onRestore: (docId: string) => void;
  onOpenUpload: () => void;
}

export function DocumentGrid({
  documents,
  foldersById,
  usersById,
  selectedDocId,
  isTrashView,
  emptyTitle,
  emptyDescription,
  showUploadCtaInEmpty,
  onSelectDocument,
  onDownload,
  onShare,
  onToggleStar,
  onRestore,
  onOpenUpload,
}: DocumentGridProps) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const isSelected = selectedDocId === doc.id;
        const folder = foldersById[doc.folderId];
        const owner = usersById[doc.ownerId];
        const firstSnippet =
          doc.rawTextContent?.slice(0, 140) ||
          doc.previewSections?.[0]?.body ||
          doc.description;

        return (
          <article
            key={doc.id}
            onClick={() => onSelectDocument(doc.id)}
            className={`group cursor-pointer bg-white rounded-lg border transition-colors flex flex-col overflow-hidden ${
              isSelected
                ? 'border-[#0B3D91] ring-1 ring-[#0B3D91]/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Minimal Document Preview Band */}
            <div className="h-28 px-4 py-3 bg-[#F8FAFC] border-b border-slate-100 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 min-w-0">
                  <FileTypeIcon category={doc.fileCategory} className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-[11.5px] text-slate-600 tabular-nums truncate">
                    {doc.recordId}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-medium text-slate-500 shrink-0">
                  {doc.extension}
                </span>
              </div>
              {doc.blobUrl && doc.fileCategory === 'image' ? (
                <img
                  src={doc.blobUrl}
                  alt={doc.title}
                  className="h-16 w-full object-cover rounded border border-slate-200"
                />
              ) : (
                <p className="text-[12px] text-slate-500 line-clamp-3 leading-relaxed">
                  {firstSnippet}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <h3 className="font-display text-[14.5px] font-semibold text-slate-900 leading-snug line-clamp-2">
                  {doc.title}
                </h3>
                <div className="mt-1.5 text-[12px] text-slate-500 truncate">
                  <span>{folder?.name ?? doc.department}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{getAccessScopeLabel(doc.accessScope)}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono tabular-nums">{formatBytes(doc.sizeBytes)}</span>
                </div>
              </div>

              <div
                className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[12px] text-slate-500 truncate">
                  <span>{owner?.fullName ?? 'Unknown'}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">{formatShortDate(doc.updatedAt)}</span>
                </div>
                {isTrashView ? (
                  <button
                    type="button"
                    onClick={() => onRestore(doc.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0B3D91] hover:underline shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDownload(doc)}
                      aria-label={`Download ${doc.title}`}
                      className="p-1.5 rounded text-slate-500 hover:text-[#0B3D91] hover:bg-slate-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onShare(doc)}
                      aria-label={`Share ${doc.title}`}
                      className="p-1.5 rounded text-slate-500 hover:text-[#0B3D91] hover:bg-slate-100 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStar(doc.id)}
                      aria-label={doc.isStarred ? `Unstar ${doc.title}` : `Star ${doc.title}`}
                      className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                        doc.isStarred ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
