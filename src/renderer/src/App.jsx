import React, { useEffect, useState } from 'react'
import ViewTab from './components/ViewTab.jsx'
import UploadTab from './components/UploadTab.jsx'
import Settings from './components/Settings.jsx'
import PasswordPrompt from './components/PasswordPrompt.jsx'

export default function App() {
  const [tab, setTab] = useState('view')
  const [settings, setSettings] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  const refreshSettings = async () => {
    const s = await window.api.getSettings()
    setSettings(s)
    return s
  }

  useEffect(() => {
    refreshSettings().then((s) => {
      // First run with nothing configured: open Settings automatically.
      if (!s.username || !s.hasApiKey) setShowSettings(true)
    })
  }, [])

  // Prompt for the password (if one is set) before opening Settings.
  const requestSettings = async () => {
    const required = await window.api.settingsPasswordRequired()
    if (required) setShowPasswordPrompt(true)
    else setShowSettings(true)
  }

  const configured = settings && settings.username && settings.hasApiKey

  return (
    <div className="app">
      <div className="titlebar">
        <div className="brand">
          <div className="logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5S13.5 3.62 13.5 5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7.5 2.79 7.5 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
            </svg>
          </div>
          <div>
            <h1>RFMS Attachment Bridge</h1>
            <p>View, download &amp; upload job attachments</p>
          </div>
        </div>
        <button className="icon-btn" onClick={requestSettings}>
          ⚙ Settings
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'view' ? 'active' : ''}`} onClick={() => setTab('view')}>
          View &amp; Download
        </button>
        <button className={`tab ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
          Upload
        </button>
      </div>

      <div className="content">
        {!configured && (
          <div className="banner info">
            RFMS credentials aren&apos;t set up yet. Click <strong>Settings</strong> to enter your username and API key.
          </div>
        )}
        {tab === 'view' ? <ViewTab disabled={!configured} /> : <UploadTab disabled={!configured} />}
      </div>

      {showPasswordPrompt && (
        <PasswordPrompt
          onClose={() => setShowPasswordPrompt(false)}
          onUnlock={() => {
            setShowPasswordPrompt(false)
            setShowSettings(true)
          }}
        />
      )}

      {showSettings && (
        <Settings
          initial={settings}
          onClose={() => setShowSettings(false)}
          onSaved={async () => {
            await refreshSettings()
            setShowSettings(false)
          }}
        />
      )}
    </div>
  )
}
