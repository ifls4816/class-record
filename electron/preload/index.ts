import os from 'os'
import { contextBridge, ipcRenderer } from 'electron'
// 此处与业务无关 只是为了打印store数据
// import Store from 'electron-store'
// console.log('当前store', new Store().store)

const store = {
  // 页面render调用主线程main方法
  get(key: any) {
    return ipcRenderer.sendSync('electron-store-get', key)
  },
  set(property: any, val: any) {
    ipcRenderer.send('electron-store-set', property, val)
  },
  del(key: any) {
    ipcRenderer.send('electron-store-del', key)
  },
}

const backup = {
  get(key: any) {
    return ipcRenderer.sendSync('electron-backup-get', key)
  },
  set() {
    ipcRenderer.send('electron-backup-set')
  },
}

// 用于暴漏给js的属性或方法 此处定义的值需要到types/gloabal.d.ts定义类型
contextBridge.exposeInMainWorld('electronAPI', {
  platform: os.platform(),
  store,
  backup,
})
