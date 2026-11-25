import { useState, useMemo } from 'react';
import type { ActivityAction, ActivityEntry, UserAccount } from '../types/dms';
import { formatDateTime } from '../utils/formatters';

interface ActivityLogViewProps {
  activities: ActivityEntry[];
  usersById: Record<string, UserAccount>;
  searchQuery: string;
  onInspectByRecordId: (recordId: string) => void;
}

type ActionFilter = 'all' | 'uploaded' | 'retrieved' | 'shared' | 'organized';

function getActionLabel(action: ActivityAction): { label: string; colorClass: string } {
  switch (action) {
    case 'uploaded':
      return { label: 'Uploaded', colorClass: 'text-[#0B3D91] font-medium' };
    case 'retrieved':
      return { label: 'Retrieved', colorClass: 'text-emerald-700 font-medium' };
    case 'shared':
      return { label: 'Access Changed', colorClass: 'text-amber-800 font-medium' };
    case 'organized':
      return { label: 'Organized', colorClass: 'text-slate-700 font-medium' };
    case 'starred':
      return { label: 'Starred', colorClass: 'text-slate-600' };
    case 'trashed':
      return { label: 'Moved to Trash', colorClass: 'text-red-700 font-medium' };
    case 'restored':
      return { label: 'Restored', colorClass: 'text-emerald-700 font-medium' };
    case 'folder_created':
      return { label: 'Folder Created', colorClass: 'text-[#0B3D91] font-medium' };
    case 'user_updated':
      return { label: 'User Updated', colorClass: 'text-slate-700 font-medium' };
  }
}

export function ActivityLogView({
  activities,
  usersById,
  searchQuery,
  onInspectByRecordId,
}: ActivityLogViewProps) {
  const [filter, setFilter] = useState<ActionFilter>('all');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activities.filter((entry) => {
      if (filter === 'uploaded' && entry.action !== 'uploaded') return false;
      if (filter === 'retrieved' && entry.action !== 'retrieved') return false;
      if (filter === 'shared' && entry.action !== 'shared') return false;
      if (
        filter === 'organized' &&
        !['organized', 'folder_created', 'trashed', 'restored'].includes(entry.action)
      ) {
        return false;
      }

      if (!q) return true;
      const actor = usersById[entry.actorId];
      return (
        entry.targetName.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        (entry.recordId?.toLowerCase().includes(q) ?? false) ||
        entry.workstationId.toLowerCase().includes(q) ||
        (actor?.fullName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [activities, filter, searchQuery, usersById]);

  const filterTabs: Array<{ id: ActionFilter; label: string }> = [
    { id: 'all', label: 'All Events' },
    { id: 'uploaded', label: 'Uploads' },
    { id: 'retrieved', label: 'Retrievals' },
    { id: 'shared', label: 'Access Changes' },
    { id: 'organized', label: 'Organization' },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Central Server Activity Log
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Chronological record of uploads, file retrievals, folder organization, and permission
            updates across workstations.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start sm:self-auto overflow-x-auto max-w-full">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-900">No matching activity records</p>
            <p className="text-xs text-slate-500 mt-1">
              Try clearing your search filter or switching event categories.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[12px] font-semibold text-slate-600">
                  <th className="py-2.5 pl-4 pr-3 whitespace-nowrap">Timestamp</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Authorized User</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Workstation</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Event</th>
                  <th className="py-2.5 pl-3 pr-4 whitespace-nowrap">Record & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {filtered.map((entry) => {
                  const actor = usersById[entry.actorId];
                  const actionMeta = getActionLabel(entry.action);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-4 pr-3 font-mono text-[12px] text-slate-500 tabular-nums whitespace-nowrap align-top">
                        {formatDateTime(entry.timestamp)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap align-top">
                        <div className="font-medium text-slate-900">
                          {actor?.fullName ?? 'System'}
                        </div>
                        <div className="text-[11.5px] text-slate-500">{actor?.department ?? ''}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-slate-600 whitespace-nowrap align-top">
                        {entry.workstationId}
                      </td>
                      <td className={`py-3 px-3 text-xs whitespace-nowrap align-top ${actionMeta.colorClass}`}>
                        {actionMeta.label}
                      </td>
                      <td className="py-3 pl-3 pr-4 align-top">
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                          {entry.recordId ? (
                            <button
                              type="button"
                              onClick={() => onInspectByRecordId(entry.recordId!)}
                              className="font-medium text-[#0B3D91] hover:underline text-left"
                            >
                              {entry.targetName}
                            </button>
                          ) : (
                            <span className="font-medium text-slate-900">{entry.targetName}</span>
                          )}
                          {entry.recordId && (
                            <span className="font-mono text-[11.5px] text-slate-400 tabular-nums">
                              {entry.recordId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.details}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
