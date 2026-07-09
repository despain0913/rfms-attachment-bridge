export const DOC_TYPES = ['Order', 'Quote']

const MIME = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff'
}

export const mimeFor = (ext) => MIME[(ext || '').toLowerCase()] || 'application/octet-stream'

export const isImage = (ext) => mimeFor(ext).startsWith('image/')
export const isPdf = (ext) => (ext || '').toLowerCase() === 'pdf'
export const canPreview = (ext) => isImage(ext) || isPdf(ext)

export function formatSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Build a sensible file name from an attachment's description + extension.
export function suggestedName(att) {
  const ext = (att.fileExtension || '').toLowerCase()
  let name = (att.description || '').trim() || `attachment_${att.id}`
  if (ext && !name.toLowerCase().endsWith(`.${ext}`)) name += `.${ext}`
  return name
}
