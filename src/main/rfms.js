// RFMS Cloud API client. Runs in the Electron main process so the API key /
// session token never reach the renderer. Handles session begin + auto-refresh.
import { promises as fs } from 'node:fs'
import { extname } from 'node:path'
import { readSettings } from './store.js'

let session = { token: null, expires: 0 }

const b64 = (s) => Buffer.from(s).toString('base64')

export function resetSession() {
  session = { token: null, expires: 0 }
}

async function beginSession() {
  const { username, apiKey, baseUrl } = await readSettings()
  if (!username || !apiKey) {
    throw new Error('RFMS credentials are not configured. Open Settings to enter your username and API key.')
  }
  let res
  try {
    res = await fetch(`${baseUrl}/v2/session/begin`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + b64(`${username}:${apiKey}`),
        'Content-Type': 'application/json'
      },
      body: '{}'
    })
  } catch (e) {
    throw new Error(`Could not reach RFMS at ${baseUrl}. Check your internet connection and the Base URL. (${e.message})`)
  }
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Unexpected response from RFMS (HTTP ${res.status}). ${text.slice(0, 200)}`)
  }
  if (!res.ok || data.authorized === false || !data.sessionToken) {
    throw new Error(data.message || data.detail || `Authentication failed (HTTP ${res.status}). Check your username and API key.`)
  }
  session.token = data.sessionToken
  const parsed = data.sessionExpires ? Date.parse(data.sessionExpires) : NaN
  session.expires = Number.isNaN(parsed) ? Date.now() + 30 * 60 * 1000 : parsed
  return session.token
}

async function getToken() {
  // Refresh a minute before expiry to avoid using a token mid-flight.
  if (session.token && session.expires - Date.now() > 60_000) return session.token
  return beginSession()
}

async function authedFetch(pathname, options = {}, retry = true) {
  const { username, baseUrl } = await readSettings()
  const token = await getToken()
  const res = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: 'Basic ' + b64(`${username}:${token}`),
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  // A stale/invalid token: drop it and retry once with a fresh session.
  if ((res.status === 401 || res.status === 403) && retry) {
    resetSession()
    return authedFetch(pathname, options, false)
  }
  return res
}

async function parseJson(res, action) {
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Unexpected response while ${action} (HTTP ${res.status}). ${text.slice(0, 200)}`)
  }
  if (!res.ok || (data.status && String(data.status).toLowerCase() !== 'success')) {
    throw new Error(data.detail || data.message || `${action} failed (HTTP ${res.status}).`)
  }
  return data
}

export async function testConnection() {
  resetSession()
  await beginSession()
  return { ok: true, expires: session.expires }
}

export async function listAttachments({ documentNumber, documentType }) {
  const body = { documentNumber: String(documentNumber).trim(), documentType }
  const res = await authedFetch('/v2/attachments', { method: 'POST', body: JSON.stringify(body) })
  const data = await parseJson(res, 'listing attachments')
  const arr = Array.isArray(data.result) ? data.result : []
  // Strip inline fileData/path — file bytes are fetched on demand for view/download.
  return arr.map((a) => ({
    id: a.id,
    fileExtension: (a.fileExtension || '').toLowerCase(),
    size: a.size,
    description: a.description || ''
  }))
}

export async function getAttachment(id) {
  const res = await authedFetch(`/v2/attachment/${encodeURIComponent(id)}`, { method: 'GET' })
  const data = await parseJson(res, 'retrieving the attachment')
  const base64 = data.detail || (typeof data.result === 'string' && data.result !== 'OK' ? data.result : '')
  if (!base64) throw new Error('RFMS returned no file data for this attachment.')
  return base64
}

export async function uploadAttachments({ documentNumber, documentType, description, files }) {
  const results = []
  for (const f of files) {
    try {
      const buf = await fs.readFile(f.path)
      const ext = (f.ext || extname(f.path).replace(/^\./, '')).toLowerCase()
      const body = {
        documentNumber: String(documentNumber).trim(),
        documentType,
        fileExtension: ext,
        fileData: buf.toString('base64'),
        description: (description && description.trim()) || f.name
      }
      const res = await authedFetch('/v2/attachment', { method: 'POST', body: JSON.stringify(body) })
      await parseJson(res, `uploading ${f.name}`)
      results.push({ name: f.name, ok: true })
    } catch (e) {
      results.push({ name: f.name, ok: false, error: String(e.message || e) })
    }
  }
  return results
}
