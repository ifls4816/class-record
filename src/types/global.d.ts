import { ElectronStore } from 'electron-store'

interface Backup {
  get: () => {}
  set: () => {}
}

export interface IElectronAPI {
  platform: string
  store: ElectronStore
  backup: Backup
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
