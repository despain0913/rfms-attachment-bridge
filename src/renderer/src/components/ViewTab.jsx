import React, { useState } from 'react'
import { DOC_TYPES, canPreview, isPdf, formatSize, suggestedName, mimeFor } from '../util.js'

export default function ViewTab({ disabled }) {
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentType, setDocumentType] = useState('Order')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [attachments, setAttachments] = useState(null)
  const [preview, setPreview] = useState(null)
  const [notice, setNotice] = useState(null)

  const search = async () => {
    if (!documentNumber.trim()) return
    setBusy(true)
    setError(null)
    setNotice(null)
    setAttachments(null)
    try {
      const result = await window.api.listAttachments({
        documentNumber,
        documentType
      })
      setAttachments(result)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  const openPreview = async (att) => {
    setPreview({ att, loading: true, dataUrl: null, error: null })
    try {
      const base64 = await window.api.getData(att.id)
      const dataUrl = `data:${mimeFor(att.fileExtension)};base64,${base64}`
      setPreview({ att, loading: false, dataUrl, error: null })
    } catch (e) {
      setPreview({ att, loading: false, dataUrl: null, error: String(e.message || e) })
    }
  }

  const download = async (att) => {
    setNotice(null)
    setError(null)
    try {
      const r = await window.api.downloadAttachment({ id: att.id, name: suggestedName(att) })
      if (r.saved) setNotice(`Saved to ${r.path}`)
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  const downloadAll = async () => {
    setNotice(null)
    setError(null)
    try {
      const items = attachments.map((a) => ({ id: a.id, name: suggestedName(a) }))
      const r = await window.api.downloadAll(items)
      if (r.saved) {
        const ok = r.results.filter((x) => x.ok).length
        const fail = r.results.length - ok
        setNotice(`Saved ${ok} file${ok === 1 ? '' : 's'} to ${r.dir}${fail ? ` — ${fail} failed` : ''}.`)
      }
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>Document Type</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} disabled={disabled}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Document Number</label>
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="e.g. 12345"
              disabled={disabled}
              style={{ width: '100%' }}
            />
          </div>
          <button className="btn" onClick={search} disabled={disabled || busy || !documentNumber.trim()}>
            {busy ? <span className="spinner" /> : 'Search'}
          </button>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}
      {notice && <div className="banner success">{notice}</div>}

      {attachments && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>
              {attachments.length} attachment{attachments.length === 1 ? '' : 's'} for {documentType} {documentNumber}
            </strong>
            {attachments.length > 0 && (
              <button className="btn secondary small" onClick={downloadAll}>
                ⬇ Download all
              </button>
            )}
          </div>

          {attachments.length === 0 ? (
            <div className="empty">No attachments found for this document.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.description || <span style={{ color: 'var(--muted)' }}>(no description)</span>}</td>
                    <td>
                      <span className="filetag">{a.fileExtension || '?'}</span>
                    </td>
                    <td>{formatSize(a.size)}</td>
                    <td>
                      <div className="actions">
                        {canPreview(a.fileExtension) && (
                          <button className="btn secondary small" onClick={() => openPreview(a)}>
                            View
                          </button>
                        )}
                        <button className="btn small" onClick={() => download(a)}>
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{suggestedName(preview.att)}</h3>
              <button className="close-x" onClick={() => setPreview(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {preview.loading && <span className="spinner" />}
              {preview.error && <div className="banner error">{preview.error}</div>}
              {preview.dataUrl &&
                (isPdf(preview.att.fileExtension) ? (
                  <iframe title="preview" src={preview.dataUrl} />
                ) : (
                  <img alt={suggestedName(preview.att)} src={preview.dataUrl} />
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
