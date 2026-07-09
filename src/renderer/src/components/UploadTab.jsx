import React, { useState } from 'react'
import { DOC_TYPES, documentNumberError, exampleNumber } from '../util.js'

export default function UploadTab({ disabled }) {
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentType, setDocumentType] = useState('Order')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const addFiles = (list) => {
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.path))
      const next = [...prev]
      for (const f of list) if (!seen.has(f.path)) next.push(f)
      return next
    })
  }

  const pick = async () => {
    const picked = await window.api.pickFiles()
    if (picked.length) addFiles(picked)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).map((file) => {
      const path = window.api.pathForFile(file)
      const name = file.name
      const dot = name.lastIndexOf('.')
      return { path, name, ext: dot >= 0 ? name.slice(dot + 1) : '' }
    })
    addFiles(dropped.filter((f) => f.path))
  }

  const removeFile = (path) => setFiles((prev) => prev.filter((f) => f.path !== path))

  const docError = documentNumberError(documentType, documentNumber)

  const upload = async () => {
    if (docError || files.length === 0) {
      if (docError) setError(docError)
      return
    }
    setBusy(true)
    setResults(null)
    setError(null)
    try {
      const res = await window.api.uploadAttachments({
        documentNumber: documentNumber.trim().toUpperCase(),
        documentType,
        description: description.trim() || undefined,
        files
      })
      setResults(res)
      // Clear the successfully uploaded files from the queue.
      const failed = new Set(res.filter((r) => !r.ok).map((r) => r.name))
      setFiles((prev) => prev.filter((f) => failed.has(f.name)))
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
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
          <div className="field">
            <label>Order/Quote Number</label>
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={`e.g. ${exampleNumber(documentType)}`}
              disabled={disabled}
            />
            {documentNumber.trim() && docError && (
              <span className="hint" style={{ color: 'var(--danger)' }}>
                {docError}
              </span>
            )}
          </div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Description (optional — applied to all files; blank uses each file name)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} disabled={disabled} />
        </div>

        <div
          className={`dropzone ${dragging ? 'drag' : ''}`}
          style={{ marginTop: 16 }}
          onClick={pick}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {dragging ? 'Drop files to add them' : 'Drag & drop files here, or click to choose files'}
        </div>

        {files.length > 0 && (
          <ul className="filelist">
            {files.map((f) => (
              <li key={f.path}>
                <span>{f.name}</span>
                <button className="remove" onClick={() => removeFile(f.path)} title="Remove">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn" onClick={upload} disabled={disabled || busy || !!docError || files.length === 0}>
            {busy ? <span className="spinner" /> : `Upload ${files.length || ''} file${files.length === 1 ? '' : 's'}`.trim()}
          </button>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}

      {results && (
        <div className="card">
          <strong>Upload results</strong>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>
                    {r.ok ? (
                      <span className="status-pill ok">Uploaded</span>
                    ) : (
                      <span className="status-pill fail" title={r.error}>
                        Failed — {r.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
