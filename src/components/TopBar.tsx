import { useEffect, useRef } from 'react';
import { Menu, Search, Upload, X, ChevronRight } from 'lucide-react';

interface TopBarProps {
  breadcrumbRoot: string;
  breadcrumbCurrent: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenUpload: () => void;
  onOpenMobileSidebar: () => void;
  onResetToRoot: () => void;
}

export function TopBar({
  breadcrumbRoot,
  breadcrumbCurrent,
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onOpenMobileSidebar,
  onResetToRoot,
}: TopBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
      {/* Zone 1: Contextual Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 -ml-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          <button
            type="button"
            onClick={onResetToRoot}
            className="hidden sm:inline text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            {breadcrumbRoot}
          </button>
          <ChevronRight
            className="hidden sm:inline w-4 h-4 text-slate-300 shrink-0"
            aria-hidden="true"
          />
          <span className="font-display font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-[260px]">
            {breadcrumbCurrent}
          </span>
        </nav>
      </div>

      {/* Zone 2: Live Repository Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, record ID, tag, or uploader..."
            aria-label="Search documents in central repository"
            className="w-full h-10 pl-9 pr-14 rounded-md bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0B3D91] focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 p-1 rounded text-slate-400 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd
              aria-hidden="true"
              className="hidden md:inline-block absolute right-3 text-[11px] font-mono text-slate-400 pointer-events-none"
            >
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[#0B3D91] hover:bg-[#093074] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <Upload className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Upload Document</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>
    </header>
  );
}
