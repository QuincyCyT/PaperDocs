import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { DocumentRecord, FolderItem } from '../types/dms';

interface OrganizeModalProps {
  /** Single document to edit metadata/folder, OR null when bulk-moving */
  document: DocumentRecord | null;
  bulkCount: number;
  isOpen: boolean;
  folders: FolderItem[];
  onClose: () => void;
  onSaveSingle: (
    docId: string,
    updates: { title: string; folderId: string; tags: string[]; description: string }
  ) => void;
  onSaveBulkMove: (folderId: string) => void;
}

export function OrganizeModal({
  document: doc,
  bulkCount,
  isOpen,
  folders,
  onClose,
  onSaveSingle,
  onSaveBulkMove,
}: OrganizeModalProps) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(folders[0]?.id ?? '');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      setFolderId(doc.folderId);
      setTagsInput(doc.tags.join(', '));
      setDescription(doc.description);
    } else if (isOpen) {
      setFolderId(folders[0]?.id ?? '');
    }
  }, [doc, isOpen, folders]);

  if (!isOpen) return null;

  const isBulk = !doc && bulkCount > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isBulk) {
      onSaveBulkMove(folderId);
      onClose();
      return;
    }
    if (!doc || !title.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSaveSingle(doc.id, {
      title: title.trim(),
      folderId,
      tags,
      description: description.trim(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="organize-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2
              id="organize-modal-title"
              className="font-display text-base font-bold text-slate-900"
            >
              {isBulk ? `Move ${bulkCount} Selected Records` : 'Organize Document Record'}
            </h2>
            {doc && (
              <p className="text-xs font-mono text-slate-500 mt-0.5">{doc.recordId}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close organize dialog"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {!isBulk && (
            <div>
              <label htmlFor="org-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Document Title
              </label>
              <input
                id="org-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="org-folder" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Central Folder Assignment
            </label>
            <select
              id="org-folder"
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

          {!isBulk && (
            <>
              <div>
                <label htmlFor="org-tags" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Search Keywords (comma-separated)
                </label>
                <input
                  id="org-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="org-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Record Summary
                </label>
                <textarea
                  id="org-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-[#0B3D91] hover:bg-[#093074] text-white text-sm font-medium whitespace-nowrap"
            >
              {isBulk ? 'Move Records' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
