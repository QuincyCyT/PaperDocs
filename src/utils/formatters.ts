import type {
  AccessScope,
  DocumentRecord,
  FileCategory,
  UserAccount,
} from '../types/dms';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const val = bytes / Math.pow(k, i);
  return `${val >= 100 || i === 0 ? val.toFixed(0) : val.toFixed(2)} ${units[i]}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function detectFileCategory(fileName: string, mimeType = ''): FileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf' || mimeType.includes('pdf')) return 'pdf';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mimeType.includes('sheet') || mimeType.includes('csv')) {
    return 'spreadsheet';
  }
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext) || mimeType.includes('presentation')) {
    return 'presentation';
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'tif', 'tiff'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
    return 'archive';
  }
  return 'document';
}

export function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return 'FILE';
  return parts[parts.length - 1].toUpperCase();
}

export function getFileCategoryLabel(category: FileCategory): string {
  switch (category) {
    case 'pdf':
      return 'PDF';
    case 'document':
      return 'Document';
    case 'spreadsheet':
      return 'Spreadsheet';
    case 'presentation':
      return 'Presentation';
    case 'image':
      return 'Image';
    case 'archive':
      return 'Archive';
  }
}

export function getAccessScopeLabel(scope: AccessScope): string {
  switch (scope) {
    case 'organization':
      return 'Organization';
    case 'department':
      return 'Department';
    case 'restricted':
      return 'Restricted';
  }
}

export function canUserAccessDocument(doc: DocumentRecord, user: UserAccount): boolean {
  if (user.role === 'Administrator') return true;
  if (doc.ownerId === user.id) return true;
  if (doc.accessScope === 'organization') return true;
  if (doc.accessScope === 'department' && doc.department === user.department) return true;
  return doc.sharedWith.some((grant) => grant.userId === user.id);
}

export function canUserManageDocument(doc: DocumentRecord, user: UserAccount): boolean {
  if (user.role === 'Administrator') return true;
  if (doc.ownerId === user.id) return true;
  const grant = doc.sharedWith.find((g) => g.userId === user.id);
  return grant?.permission === 'organize';
}

export function generateChecksum(seed: string): string {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const part1 = ((h1 >>> 0).toString(16)).padStart(8, '0');
  const part2 = ((h2 >>> 0).toString(16)).padStart(8, '0');
  return `sha256:${part1}${part2}`;
}

export function triggerDocumentDownload(doc: DocumentRecord, ownerName: string): void {
  if (doc.blobUrl) {
    const link = document.createElement('a');
    link.href = doc.blobUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const lines: string[] = [
    `PAPERLESSLINK CENTRAL DOCUMENT REPOSITORY — RETRIEVED COPY`,
    `================================================================`,
    `Record ID:        ${doc.recordId}`,
    `Document Title:   ${doc.title}`,
    `File Name:        ${doc.fileName}`,
    `Department:       ${doc.department}`,
    `Owner / Uploader: ${ownerName}`,
    `Access Scope:     ${getAccessScopeLabel(doc.accessScope)}`,
    `Stored Location:  ${doc.storagePath}`,
    `Integrity Hash:   ${doc.checksum}`,
    `Last Updated:     ${formatDateTime(doc.updatedAt)}`,
    `----------------------------------------------------------------`,
    ``,
    `Summary:`,
    doc.description,
    ``,
  ];

  if (doc.rawTextContent) {
    lines.push(doc.rawTextContent);
  } else if (doc.previewSections && doc.previewSections.length > 0) {
    for (const section of doc.previewSections) {
      lines.push(section.heading.toUpperCase());
      lines.push(section.body);
      lines.push('');
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeName = doc.fileName.includes('.')
    ? `${doc.fileName.replace(/\.[^.]+$/, '')}_record.txt`
    : `${doc.fileName}_record.txt`;
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
