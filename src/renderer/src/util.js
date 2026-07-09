export const DOC_TYPES = ['Order', 'Quote']

// Required prefix for each document type: 2 letters + 6 digits.
export const DOC_PREFIX = { Order: 'CG', Quote: 'ES' }

export const exampleNumber = (documentType) => `${DOC_PREFIX[documentType] || 'XX'}123456`

// Returns an error message if the number is invalid for the given type, else null.
export function documentNumberError(documentType, value) {
  const v = (value || '').trim().toUpperCase()
  if (!v) return 'Please enter an order/quote number.'
  const prefix = DOC_PREFIX[documentType]
  const pattern = prefix ? new RegExp(`^${prefix}\\d{6}$`) : /^[A-Z]{2}\d{6}$/
  if (!pattern.test(v)) {
    return prefix
      ? `${documentType} numbers must be "${prefix}" followed by 6 digits (e.g. ${prefix}123456).`
      : 'Number must be 2 letters followed by 6 digits.'
  }
  return null
}

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
