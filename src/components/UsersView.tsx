import { useState, useMemo } from 'react';
import { UserPlus, ArrowRightLeft, CheckCircle2, Ban, X } from 'lucide-react';
import type { DocumentRecord, UserAccount, UserRole } from '../types/dms';
import { formatBytes, formatDateTime } from '../utils/formatters';

interface UsersViewProps {
  users: UserAccount[];
  documents: DocumentRecord[];
  currentUser: UserAccount;
  searchQuery: string;
  onSwitchUser: (userId: string) => void;
  onAddUser: (user: Omit<UserAccount, 'id' | 'initials' | 'lastActiveAt' | 'status'>) => void;
  onToggleUserStatus: (userId: string) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
}

const DEPARTMENTS = [
  'Records Administration',
  'Finance & Payroll',
  'Human Resources',
  'Operations',
  'Legal & Compliance',
];

export function UsersView({
  users,
  documents,
  currentUser,
  searchQuery,
  onSwitchUser,
  onAddUser,
  onToggleUserStatus,
  onUpdateUserRole,
}: UsersViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[1]);
  const [role, setRole] = useState<UserRole>('Staff');
  const [workstationId, setWorkstationId] = useState('WS-OPS-14');

  const isAdmin = currentUser.role === 'Administrator';

  const statsByUser = useMemo(() => {
    const map: Record<string, { count: number; bytes: number }> = {};
    for (const doc of documents) {
      if (doc.isTrashed) continue;
      if (!map[doc.ownerId]) map[doc.ownerId] = { count: 0, bytes: 0 };
      map[doc.ownerId].count += 1;
      map[doc.ownerId].bytes += doc.sizeBytes;
    }
    return map;
  }, [documents]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.workstationId.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !workstationId.trim()) return;
    onAddUser({
      fullName: fullName.trim(),
      email: email.trim(),
      department,
      role,
      workstationId: workstationId.trim().toUpperCase(),
    });
    setFullName('');
    setEmail('');
    setWorkstationId(`WS-STF-${String(users.length + 12).padStart(2, '0')}`);
    setIsAddOpen(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Authorized Personnel & Workstations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Employees authorized to connect to the central repository across office computers.
            Switch accounts to preview role-based access controls.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Authorized User</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="px-4 py-3 rounded-md bg-[#F1F5F9] border border-slate-200 text-xs text-slate-600">
          Signed in as <span className="font-semibold text-slate-900">{currentUser.fullName}</span>{' '}
          ({currentUser.role}). Only Records Administrators can add accounts or modify role
          assignments.
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[12px] font-semibold text-slate-600">
                <th className="py-2.5 pl-4 pr-3 whitespace-nowrap">Employee</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Department</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Workstation</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Role</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Stored Files</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">Session / Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13.5px]">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUser.id;
                const stats = statsByUser[user.id] ?? { count: 0, bytes: 0 };
                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-4 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-md text-xs font-display font-semibold flex items-center justify-center shrink-0 ${
                            isSelf
                              ? 'bg-[#0B3D91] text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {user.initials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {user.fullName}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-[#0B3D91]">
                                (Current Session)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {user.department}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                      <div>{user.workstationId}</div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        {formatDateTime(user.lastActiveAt)}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isAdmin && !isSelf ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            onUpdateUserRole(user.id, e.target.value as UserRole)
                          }
                          aria-label={`Role for ${user.fullName}`}
                          className="h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#0B3D91] focus:outline-none"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Department Lead">Department Lead</option>
                          <option value="Staff">Staff</option>
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-slate-700">{user.role}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      <div>{stats.count} files</div>
                      <div className="text-[11px] text-slate-400">
                        {formatBytes(stats.bytes)}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {user.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                          <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {!isSelf && user.status === 'Active' && (
                          <button
                            type="button"
                            onClick={() => onSwitchUser(user.id)}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Switch View</span>
                          </button>
                        )}
                        {isAdmin && !isSelf && (
                          <button
                            type="button"
                            onClick={() => onToggleUserStatus(user.id)}
                            className={`h-8 px-2.5 rounded text-xs font-medium transition-colors ${
                              user.status === 'Active'
                                ? 'text-red-700 hover:bg-red-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {user.status === 'Active' ? 'Suspend' : 'Restore'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-user-title"
        >
          <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 id="add-user-title" className="font-display text-base font-bold text-slate-900">
                Authorize New Personnel Account
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close add user dialog"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="u-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="u-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Sofia Villanueva"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-[#0B3D91] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="u-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work Email
                </label>
                <input
                  id="u-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.villanueva@paperlesslink.local"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-[#0B3D91] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="u-dept" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Department
                  </label>
                  <select
                    id="u-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:border-[#0B3D91] focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="u-role" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Access Role
                  </label>
                  <select
                    id="u-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:border-[#0B3D91] focus:outline-none"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Department Lead">Department Lead</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="u-ws" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Workstation ID
                </label>
                <input
                  id="u-ws"
                  type="text"
                  required
                  value={workstationId}
                  onChange={(e) => setWorkstationId(e.target.value)}
                  placeholder="WS-OPS-14"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 font-mono text-sm focus:border-[#0B3D91] focus:outline-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-md bg-[#0B3D91] hover:bg-[#093074] text-white text-sm font-medium"
                >
                  Authorize Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
