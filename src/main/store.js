// Persists app settings. The RFMS API key is encrypted at rest using Electron's
// safeStorage (backed by Windows DPAPI), so it is tied to the current Windows user.
import { app, safeStorage } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_USERNAME, DEFAULT_API_KEY, DEFAULT_BASE_URL } from './default-credentials.js'

const DEFAULTS = { username: DEFAULT_USERNAME, baseUrl: DEFAULT_BASE_URL }

const filePath = () => join(app.getPath('userData'), 'settings.json')

async function readRaw() {
  try {
    return JSON.parse(await fs.readFile(filePath(), 'utf-8'))
  } catch {
    return {}
  }
}

// Full settings, including the decrypted API key. Main-process use only.
export async function readSettings() {
  const raw = await readRaw()
  let apiKey = ''
  if (raw.apiKeyEnc) {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        apiKey = safeStorage.decryptString(Buffer.from(raw.apiKeyEnc, 'base64'))
      }
    } catch {
      apiKey = ''
    }
  } else if (raw.apiKeyPlain) {
    apiKey = raw.apiKeyPlain
  }
  // Fall back to the shared, built-in company credentials when the user
  // hasn't entered (or overridden) their own in Settings.
  if (!apiKey) apiKey = DEFAULT_API_KEY
  return {
    username: raw.username || DEFAULTS.username,
    baseUrl: (raw.baseUrl || DEFAULTS.baseUrl).replace(/\/+$/, ''),
    apiKey
  }
}

export async function writeSettings({ username, baseUrl, apiKey }) {
  const raw = await readRaw()
  const out = {
    username: username ?? raw.username ?? DEFAULTS.username,
    baseUrl: (baseUrl ?? raw.baseUrl ?? DEFAULTS.baseUrl).replace(/\/+$/, '')
  }
  const key = apiKey && apiKey.length ? apiKey : null
  if (key) {
    if (safeStorage.isEncryptionAvailable()) {
      out.apiKeyEnc = safeStorage.encryptString(key).toString('base64')
    } else {
      out.apiKeyPlain = key
    }
  } else {
    // No new key supplied: preserve whatever was already stored.
    if (raw.apiKeyEnc) out.apiKeyEnc = raw.apiKeyEnc
    if (raw.apiKeyPlain) out.apiKeyPlain = raw.apiKeyPlain
  }
  await fs.writeFile(filePath(), JSON.stringify(out, null, 2), 'utf-8')
}

// Safe to hand to the renderer — never exposes the actual key.
export async function sanitizedSettings() {
  const s = await readSettings()
  return { username: s.username, baseUrl: s.baseUrl, hasApiKey: !!s.apiKey }
}
