import { useRef, useState, useEffect } from 'react';
import { Upload, X, File as FileIcon, Trash2 } from 'lucide-react';
import type { AccessScope, FolderItem, UserAccount } from '../types/dms';
import { formatBytes } from '../utils/formatters';

export interface UploadSubmissionItem {
  file?: File;
  title: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  rawTextContent?: string;
}

export interface UploadSubmission {
  items: UploadSubmissionItem[];
  folderId: string;
  accessScope: AccessScope;
  tags: string[];
  description: string;
}

interface UploadModalProps {
  isOpen: boolean;
  folders: FolderItem[];
  defaultFolderId: string;
  currentUser: UserAccount;
  onClose: () => void;
  onSubmit: (payload: UploadSubmission) => void;
}

export function UploadModal({
  isOpen,
  folders,
  defaultFolderId,
  currentUser,
  onClose,
  onSubmit,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || folders[0]?.id || '');
  const [accessScope, setAccessScope] = useState<AccessScope>('department');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderId(defaultFolderId || folders[0]?.id || '');
      setErrorMsg('');
    }
  }, [isOpen, defaultFolderId, folders]);

  if (!isOpen) return null;

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    setSelectedFiles((prev) => {
      const merged = [...prev];
      for (const file of incoming) {
        const dup = merged.some((f) => f.name === file.name && f.size === file.size);
        if (!dup) merged.push(file);
      }
      return merged;
    });
    if (!customTitle && incoming.length === 1) {
      setCustomTitle(incoming[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    }
    setErrorMsg('');
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFiles.length === 0 && !customTitle.trim()) {
      setErrorMsg('Select at least one digital file from your computer, or enter a document title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const items: UploadSubmissionItem[] = [];

    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        let rawTextContent: string | undefined;
        const lowerName = file.name.toLowerCase();
        if (
          file.type.startsWith('text/') ||
          lowerName.endsWith('.txt') ||
          lowerName.endsWith('.csv') ||
          lowerName.endsWith('.md') ||
          lowerName.endsWith('.json')
        ) {
          try {
            const text = await file.text();
            rawTextContent = text.slice(0, 12000);
          } catch {
            rawTextContent = undefined;
          }
        }

        const resolvedTitle =
          selectedFiles.length === 1 && customTitle.trim()
            ? customTitle.trim()
            : file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');

        items.push({
          file,
          title: resolvedTitle,
          fileName: file.name,
          sizeBytes: file.size || 24576,
          mimeType: file.type || 'application/octet-stream',
          rawTextContent,
        });
      }
    } else {
      const cleanTitle = customTitle.trim();
      const safeFile = `${cleanTitle.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`;
      items.push({
        title: cleanTitle,
        fileName: safeFile,
        sizeBytes: 384000,
        mimeType: 'application/pdf',
      });
    }

    window.setTimeout(() => {
      onSubmit({
        items,
        folderId: folderId || folders[0]?.id,
        accessScope,
        tags,
        description: description.trim(),
      });
      setIsSubmitting(false);
      setSelectedFiles([]);
      setCustomTitle('');
      setTagsInput('');
      setDescription('');
      onClose();
    }, 220);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-xl bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2
              id="upload-modal-title"
              className="font-display text-base font-bold text-slate-900"
            >
              Upload to Central Repository
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Uploading from {currentUser.workstationId} · {currentUser.fullName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dialog"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          {/* Drag and Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border border-dashed px-5 py-7 text-center transition-colors ${
              isDragging
                ? 'border-[#0B3D91] bg-[#EFF5FF]'
                : 'border-slate-300 bg-[#F8FAFC] hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => addFiles(e.target.files)}
              className="hidden"
            />
            <Upload className="w-6 h-6 text-[#0B3D91] mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">
              Drop digital files here, or click to browse computer
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, DOCX, XLSX, PPTX, TXT, CSV, PNG, JPG · Stored centrally for authorized
              access
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    <span className="font-mono text-slate-400 tabular-nums shrink-0">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
                    className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Record Title */}
          <div>
            <label htmlFor="doc-title-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Document Title {selectedFiles.length > 1 ? '(applies file names for batch upload)' : ''}
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={selectedFiles.length > 1}
              placeholder="e.g., Q4 Facilities Maintenance Schedule"
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B3D91] focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Folder & Access Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doc-folder-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination Folder
              </label>
              <select
                id="doc-folder-select"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc-scope-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Shared Access Policy
              </label>
              <select
                id="doc-scope-select"
                value={accessScope}
                onChange={(e) => setAccessScope(e.target.value as AccessScope)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
              >
                <option value="organization">Organization-Wide (All Authorized Staff)</option>
                <option value="department">Department Only</option>
                <option value="restricted">Restricted (Explicit Users Only)</option>
              </select>
            </div>
          </div>

          {/* Keywords / Tags */}
          <div>
            <label htmlFor="doc-tags-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Search Keywords (comma-separated)
            </label>
            <input
              id="doc-tags-input"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., Q4-2026, Policy, Approved"
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B3D91] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="doc-desc-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Record Summary
            </label>
            <textarea
              id="doc-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context to help colleagues identify and retrieve this record..."
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B3D91] focus:outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-red-700" role="alert">
              {errorMsg}
            </p>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-4 rounded-md bg-[#0B3D91] hover:bg-[#093074] disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              {isSubmitting
                ? 'Storing in Repository...'
                : selectedFiles.length > 1
                  ? `Store ${selectedFiles.length} Documents`
                  : 'Store Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
