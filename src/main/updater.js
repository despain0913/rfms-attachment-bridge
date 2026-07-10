// Lightweight, opt-in update check. Reads a JSON manifest (from an HTTPS URL or a
// file/UNC path) and compares its version to the running app's version. No
// auto-download — it just tells the renderer a newer build exists so the user can
// go grab the installer.
import { app, shell } from 'electron'
import { promises as fs } from 'node:fs'
import { UPDATE_MANIFEST_URL } from './update-config.js'

// Compare two "MAJOR.MINOR.PATCH" strings. Returns >0 if a is newer than b.
function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0)
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

const isHttp = (s) => /^https?:\/\//i.test(s)

async function readManifest(src) {
  if (isHttp(src)) {
    // Cache-bust so users don't get a stale manifest from a proxy.
    const url = src + (src.includes('?') ? '&' : '?') + '_=' + Date.now()
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }
  return JSON.parse(await fs.readFile(src, 'utf-8'))
}

export async function checkForUpdate() {
  const current = app.getVersion()
  if (!UPDATE_MANIFEST_URL) return { current, available: false }
  try {
    const manifest = await readManifest(UPDATE_MANIFEST_URL)
    const latest = String(manifest.version || '').trim()
    if (latest && compareVersions(latest, current) > 0) {
      return {
        current,
        available: true,
        latest,
        url: manifest.url || '',
        notes: manifest.notes || ''
      }
    }
    return { current, available: false, latest }
  } catch (e) {
    // Never let an update-check failure disrupt the app.
    return { current, available: false, error: String(e.message || e) }
  }
}

export async function openDownload(url) {
  if (!url) return { ok: false }
  if (isHttp(url)) {
    await shell.openExternal(url)
  } else {
    // Reveal the installer in Explorer so the user can run it themselves.
    shell.showItemInFolder(url)
  }
  return { ok: true }
}
