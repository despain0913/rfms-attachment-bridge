import React, { useState } from 'react'

export default function PasswordPrompt({ onUnlock, onClose }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(false)
    try {
      const r = await window.api.verifySettingsPassword(password)
      if (r.ok) {
        onUnlock()
      } else {
        setError(true)
        setPassword('')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Enter Settings Password</h3>
          <button className="close-x" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ display: 'block', background: 'var(--panel)' }}>
          <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
            Settings are password-protected to prevent accidental changes to the store credentials.
          </p>
          {error && (
            <div className="banner error" style={{ margin: '0 0 12px' }}>
              Incorrect password. Please try again.
            </div>
          )}
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && password && submit()}
              placeholder="password"
            />
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" onClick={submit} disabled={busy || !password}>
              {busy ? <span className="spinner" /> : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
