import { useState } from 'react';
import { X } from 'lucide-react';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, department: string, description: string) => void;
}

const DEPARTMENTS = [
  'Finance & Payroll',
  'Human Resources',
  'Operations',
  'Legal & Compliance',
  'Records Administration',
  'General Shared',
];

export function NewFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
}: NewFolderModalProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateFolder(name.trim(), department, description.trim());
    setName('');
    setDescription('');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-folder-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2
            id="new-folder-modal-title"
            className="font-display text-base font-bold text-slate-900"
          >
            Create Central Folder
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new folder dialog"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="folder-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Folder Name
            </label>
            <input
              id="folder-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Procurement Vouchers 2026"
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B3D91] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="folder-dept" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Primary Department
            </label>
            <select
              id="folder-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="folder-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Purpose / Retention Note
            </label>
            <textarea
              id="folder-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe which records should be stored in this folder..."
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B3D91] focus:outline-none resize-none"
            />
          </div>

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
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
