import { contextBridge, ipcRenderer, webUtils } from 'electron'

const api = {
  settingsPasswordRequired: () => ipcRenderer.invoke('settings:passwordRequired'),
  verifySettingsPassword: (pw) => ipcRenderer.invoke('settings:verifyPassword', pw),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  testConnection: () => ipcRenderer.invoke('rfms:test'),
  listAttachments: (query) => ipcRenderer.invoke('rfms:list', query),
  getData: (id) => ipcRenderer.invoke('rfms:getData', id),
  downloadAttachment: (item) => ipcRenderer.invoke('rfms:download', item),
  downloadAll: (items) => ipcRenderer.invoke('rfms:downloadAll', items),
  pickFiles: () => ipcRenderer.invoke('files:pick'),
  uploadAttachments: (payload) => ipcRenderer.invoke('rfms:upload', payload),
  // Resolve the absolute path of a drag-and-dropped File.
  pathForFile: (file) => webUtils.getPathForFile(file)
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  window.api = api
}
