import { useState, useRef, useEffect } from 'react';
import {
  Files,
  Users,
  Clock,
  Star,
  Folder,
  FolderPlus,
  Trash2,
  ClipboardList,
  ShieldCheck,
  ChevronsUpDown,
  LogOut,
  Check,
  X,
} from 'lucide-react';
import type { FolderItem, NavSection, UserAccount } from '../types/dms';
import { formatBytes } from '../utils/formatters';
import { CENTRAL_SERVER_CAPACITY_BYTES } from '../data/seedData';
import { BrandMark } from './BrandMark';

interface SidebarProps {
  activeSection: NavSection;
  activeFolderId: string | null;
  folders: FolderItem[];
  folderCounts: Record<string, number>;
  sectionCounts: {
    all: number;
    shared: number;
    recent: number;
    starred: number;
    trash: number;
  };
  totalStorageBytes: number;
  currentUser: UserAccount;
  users: UserAccount[];
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectSection: (section: NavSection) => void;
  onSelectFolder: (folderId: string) => void;
  onOpenNewFolder: () => void;
  onSwitchUser: (userId: string) => void;
  onSignOut: () => void;
}

export function Sidebar({
  activeSection,
  activeFolderId,
  folders,
  folderCounts,
  sectionCounts,
  totalStorageBytes,
  currentUser,
  users,
  isMobileOpen,
  onCloseMobile,
  onSelectSection,
  onSelectFolder,
  onOpenNewFolder,
  onSwitchUser,
  onSignOut,
}: SidebarProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [accountMenuOpen]);

  const storagePercent = Math.min(
    100,
    Math.max(1.5, (totalStorageBytes / CENTRAL_SERVER_CAPACITY_BYTES) * 100)
  );

  const primaryNav: Array<{
    id: NavSection;
    label: string;
    icon: typeof Files;
    count?: number;
  }> = [
    { id: 'all', label: 'All Documents', icon: Files, count: sectionCounts.all },
    { id: 'shared', label: 'Shared Access', icon: Users, count: sectionCounts.shared },
    { id: 'recent', label: 'Recent Retrievals', icon: Clock, count: sectionCounts.recent },
    { id: 'starred', label: 'Starred Records', icon: Star, count: sectionCounts.starred },
  ];

  const managementNav: Array<{
    id: NavSection;
    label: string;
    icon: typeof Files;
    count?: number;
  }> = [
    { id: 'activity', label: 'Activity Log', icon: ClipboardList },
    { id: 'users', label: 'Authorized Users', icon: ShieldCheck },
    { id: 'trash', label: 'Trash', icon: Trash2, count: sectionCounts.trash },
  ];

  const content = (
    <div className="flex h-full flex-col bg-[#F1F5F9] border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            onSelectSection('all');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-[#0B3D91] rounded-md"
        >
          <BrandMark className="w-7 h-7 shrink-0" />
          <span className="font-display text-[17px] font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            PaperlessLink
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/70"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Repository Views */}
        <nav aria-label="Repository sections" className="space-y-0.5">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-500">
            Repository
          </div>
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id && activeFolderId === null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-[13.5px] transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B3D91]/[0.09] text-[#0B3D91] font-semibold'
                    : 'text-slate-700 font-medium hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#0B3D91]' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span
                    className={`text-xs font-mono tabular-nums shrink-0 ${
                      isActive ? 'text-[#0B3D91]' : 'text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Department Folders */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-2.5 pb-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500">
              Folders
            </span>
            <button
              type="button"
              onClick={onOpenNewFolder}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0B3D91] hover:text-[#093074] rounded px-1 py-0.5 transition-colors whitespace-nowrap shrink-0"
              title="Create new folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
          <div className="space-y-0.5">
            {folders.map((folder) => {
              const isActive = activeFolderId === folder.id;
              const count = folderCounts[folder.id] ?? 0;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    onSelectFolder(folder.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors ${
                    isActive
                      ? 'bg-[#0B3D91]/[0.09] text-[#0B3D91] font-semibold'
                      : 'text-slate-700 font-normal hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Folder
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#0B3D91]' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{folder.name}</span>
                  </span>
                  <span
                    className={`text-xs font-mono tabular-nums shrink-0 ${
                      isActive ? 'text-[#0B3D91]' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Server Management */}
        <nav aria-label="Central server administration" className="space-y-0.5">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-500">
            Central Server
          </div>
          {managementNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id && activeFolderId === null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-[13.5px] transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B3D91]/[0.09] text-[#0B3D91] font-semibold'
                    : 'text-slate-700 font-medium hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#0B3D91]' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`text-xs font-mono tabular-nums shrink-0 ${
                      isActive ? 'text-[#0B3D91]' : 'text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Central Storage Usage */}
      <div className="px-4 py-3 border-t border-slate-200/80 space-y-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-medium text-slate-600">Central Storage</span>
          <span className="font-mono text-[11.5px] text-slate-700 tabular-nums">
            {formatBytes(totalStorageBytes)} / 50 GB
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-[#0B3D91] rounded-full transition-all duration-300"
            style={{ width: `${storagePercent}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-500 font-mono truncate">
          Server 10.24.0.10 · Workstation {currentUser.workstationId}
        </div>
      </div>

      {/* Active User Account Switcher */}
      <div ref={menuRef} className="relative p-3 border-t border-slate-200/80">
        {accountMenuOpen && (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 mb-2 rounded-lg bg-white border border-slate-200 shadow-lg py-1.5 z-30"
          >
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 border-b border-slate-100">
              Switch Authorized Account
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {users
                .filter((u) => u.status === 'Active')
                .map((user) => {
                  const selected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSwitchUser(user.id);
                        setAccountMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                        selected
                          ? 'bg-[#0B3D91]/[0.06] text-[#0B3D91]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{user.fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {user.role} · {user.workstationId}
                        </div>
                      </div>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0 text-[#0B3D91]" />}
                    </button>
                  );
                })}
            </div>
            <div className="border-t border-slate-100 pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAccountMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Workstation</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountMenuOpen((prev) => !prev)}
          aria-expanded={accountMenuOpen}
          className="w-full flex items-center justify-between gap-2.5 p-2 rounded-md hover:bg-slate-200/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#0B3D91] text-white font-display text-xs font-semibold flex items-center justify-center shrink-0">
              {currentUser.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[11.5px] text-slate-500 truncate">
                {currentUser.role}
              </div>
            </div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile slide-over drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[82vw] h-full shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
