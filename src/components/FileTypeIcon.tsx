import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Archive,
  File,
} from 'lucide-react';
import type { FileCategory } from '../types/dms';

interface FileTypeIconProps {
  category: FileCategory;
  className?: string;
}

export function FileTypeIcon({ category, className = 'w-4 h-4' }: FileTypeIconProps) {
  switch (category) {
    case 'pdf':
      return <FileText className={`${className} text-red-700`} aria-hidden="true" />;
    case 'spreadsheet':
      return <FileSpreadsheet className={`${className} text-emerald-700`} aria-hidden="true" />;
    case 'presentation':
      return <Presentation className={`${className} text-amber-700`} aria-hidden="true" />;
    case 'image':
      return <ImageIcon className={`${className} text-sky-700`} aria-hidden="true" />;
    case 'archive':
      return <Archive className={`${className} text-slate-600`} aria-hidden="true" />;
    case 'document':
    default:
      return <File className={`${className} text-[#0B3D91]`} aria-hidden="true" />;
  }
}
