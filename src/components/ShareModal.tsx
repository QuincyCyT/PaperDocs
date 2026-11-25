import { useState, useEffect } from 'react';
import { X, Copy, Check, Globe, Building2, Lock, UserPlus, Trash2 } from 'lucide-react';
import type {
  AccessScope,
  DocumentRecord,
  ShareGrant,
  SharePermission,
  UserAccount,
} from '../types/dms';
import { canUserManageDocument } from '../utils/formatters';

interface ShareModalProps {
  document: DocumentRecord | null;
  users: UserAccount[];
  currentUser: UserAccount;
  onClose: () => void;
  onSaveAccess: (docId: string, scope: AccessScope, grants: ShareGrant[]) => void;
}

export function ShareModal({
  document: doc,
  users,
  currentUser,
  onClose,
  onSaveAccess,
}: ShareModalProps) {
  const [scope, setScope] = useState<AccessScope>('department');
  const [grants, setGrants] = useState<ShareGrant[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<SharePermission>('view');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (doc) {
      setScope(doc.accessScope);
      setGrants(doc.sharedWith);
      setSelectedUserId('');
      setSelectedPermission('view');
    }
  }, [doc]);

  if (!doc) return null;

  const canManage = canUserManageDocument(doc, currentUser);
  const internalLink = `paperlesslink://central/${doc.recordId}`;

  const availableUsers = users.filter(
    (u) =>
      u.status === 'Active' &&
      u.id !== doc.ownerId &&
      !grants.some((g) => g.userId === u.id)
  );

  function handleAddGrant() {
    if (!selectedUserId) return;
    setGrants((prev) => [
      ...prev,
      {
        userId: selectedUserId,
        permission: selectedPermission,
        grantedAt: new Date().toISOString(),
        grantedBy: currentUser.id,
      },
    ]);
    setSelectedUserId('');
  }

  function handleChangePermission(userId: string, permission: SharePermission) {
    setGrants((prev) =>
      prev.map((g) => (g.userId === userId ? { ...g, permission } : g))
    );
  }

  function handleRemoveGrant(userId: string) {
    setGrants((prev) => prev.filter((g) => g.userId !== userId));
  }

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(internalLink).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleSave() {
    if (!doc) return;
    onSaveAccess(doc.id, scope, grants);
    onClose();
  }

  const scopeOptions: Array<{
    value: AccessScope;
    label: string;
    desc: string;
    icon: typeof Globe;
  }> = [
    {
      value: 'organization',
      label: 'Organization-Wide',
      desc: 'Any active authorized staff member across all workstations',
      icon: Globe,
    },
    {
      value: 'department',
      label: `${doc.department} Only`,
      desc: 'Accessible to assigned department workstations and listed users',
      icon: Building2,
    },
    {
      value: 'restricted',
      label: 'Restricted Access',
      desc: 'Only the record owner, records administrators, and listed users',
      icon: Lock,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="share-modal-title"
              className="font-display text-base font-bold text-slate-900"
            >
              Manage Shared Access
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {doc.recordId} · {doc.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Access Scope Selector */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Repository Access Policy</div>
            <div className="space-y-2">
              {scopeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = scope === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!canManage}
                    onClick={() => setScope(opt.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded-md border text-left transition-colors disabled:opacity-65 ${
                      active
                        ? 'border-[#0B3D91] bg-[#EFF5FF]/60'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        active ? 'text-[#0B3D91]' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          active ? 'text-[#0B3D91]' : 'text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct User Grants */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700">
              Explicit Authorized Personnel
            </div>

            {canManage && availableUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  aria-label="Select employee to grant access"
                  className="flex-1 h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
                >
                  <option value="">Select staff member...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} — {user.department} ({user.workstationId})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value as SharePermission)}
                  aria-label="Permission level"
                  className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
                >
                  <option value="view">View & Retrieve</option>
                  <option value="organize">Organize & View</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddGrant}
                  disabled={!selectedUserId}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Grant</span>
                </button>
              </div>
            )}

            {grants.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No individual user overrides added. Access follows the repository policy above.
              </p>
            ) : (
              <ul className="border border-slate-200 rounded-md divide-y divide-slate-100">
                {grants.map((grant) => {
                  const user = users.find((u) => u.id === grant.userId);
                  if (!user) return null;
                  return (
                    <li
                      key={grant.userId}
                      className="px-3 py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {user.department} · <span className="font-mono">{user.workstationId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={grant.permission}
                          disabled={!canManage}
                          onChange={(e) =>
                            handleChangePermission(
                              grant.userId,
                              e.target.value as SharePermission
                            )
                          }
                          aria-label={`Permission for ${user.fullName}`}
                          className="h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-700 focus:border-[#0B3D91] focus:outline-none disabled:bg-slate-50"
                        >
                          <option value="view">View & Retrieve</option>
                          <option value="organize">Organize & View</option>
                        </select>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGrant(grant.userId)}
                            aria-label={`Revoke access for ${user.fullName}`}
                            className="p-1.5 rounded text-slate-400 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Direct Central Server Link */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="text-xs font-semibold text-slate-700">
              Internal Central Server Reference
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={internalLink}
                className="flex-1 h-9 px-3 rounded-md bg-[#F8FAFC] border border-slate-200 font-mono text-xs text-slate-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {!canManage && (
            <p className="text-xs text-amber-800">
              Your account has view-only access to this document. Contact the document owner or a
              Records Administrator to modify permissions.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-[#F8FAFC] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
          >
            {canManage ? 'Cancel' : 'Close'}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={handleSave}
              className="h-9 px-4 rounded-md bg-[#0B3D91] hover:bg-[#093074] text-white text-sm font-medium whitespace-nowrap"
            >
              Save Permissions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
