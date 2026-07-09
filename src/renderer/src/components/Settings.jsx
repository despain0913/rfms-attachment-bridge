import React, { useState } from 'react'

export default function Settings({ initial, onClose, onSaved }) {
  const [username, setUsername] = useState(initial?.username || '')
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl || 'https://api.rfms.online')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const save = async () => {
    setBusy(true)
    setMsg(null)
    try {
      await window.api.saveSettings({ username: username.trim(), baseUrl: baseUrl.trim(), apiKey })
      setApiKey('')
      await onSaved()
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message || e) })
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    setBusy(true)
    setMsg(null)
    try {
      // Persist first so the test uses the values on screen.
      await window.api.saveSettings({ username: username.trim(), baseUrl: baseUrl.trim(), apiKey })
      setApiKey('')
      const r = await window.api.testConnection()
      const when = r.expires ? new Date(r.expires).toLocaleString() : 'soon'
      setMsg({ type: 'success', text: `Connected successfully. Session valid until ${when}.` })
    } catch (e) {
      setMsg({ type: 'error', text: String(e.message || e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>RFMS Settings</h3>
          <button className="close-x" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ display: 'block', background: 'var(--panel)' }}>
          {msg && <div className={`banner ${msg.type}`} style={{ margin: '0 0 14px' }}>{msg.text}</div>}

          <div className="banner info" style={{ margin: '0 0 16px' }}>
            This app comes pre-configured with the company&apos;s RFMS credentials — most people never need to
            open this screen. Only change these if you need to point at a different RFMS account or environment.
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>RFMS Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="store username" />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={initial?.hasApiKey ? '•••••••• (leave blank to keep current key)' : 'paste API key'}
            />
            <span className="hint">
              Stored encrypted on this PC using Windows account protection. It never leaves your machine except to sign in to RFMS.
            </span>
          </div>

          <div className="field" style={{ marginBottom: 18 }}>
            <label>Base URL</label>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            <span className="hint">Default: https://api.rfms.online</span>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn secondary" onClick={test} disabled={busy || !username}>
              {busy ? <span className="spinner" /> : 'Test Connection'}
            </button>
            <button className="btn" onClick={save} disabled={busy || !username}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
