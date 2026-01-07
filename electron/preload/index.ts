import os from 'os'
import { contextBridge, ipcRenderer } from 'electron'
// 此处与业务无关 只是为了打印store数据
// import Store from 'electron-store'
// console.log('当前store', new Store().store)

// 内存缓存，避免重复 IPC 调用
let cache: Record<string, any> = {}
let cacheInitialized = false

const store = {
  // 页面render调用主线程main方法
  get(key: any) {
    // 首次加载时初始化缓存
    if (!cacheInitialized) {
      cache = ipcRenderer.sendSync('electron-store-get-all') || {}
      cacheInitialized = true
    }
    // 优先从缓存读取
    if (key in cache) {
      return cache[key]
    }
    const value = ipcRenderer.sendSync('electron-store-get', key)
    cache[key] = value
    return value
  },
  set(property: any, val: any) {
    // 同步更新缓存
    cache[property] = val
    ipcRenderer.send('electron-store-set', property, val)
  },
  del(key: any) {
    delete cache[key]
    ipcRenderer.send('electron-store-del', key)
  },
  // 清除缓存（用于数据恢复等场景）
  clearCache() {
    cache = {}
    cacheInitialized = false
  }
}

const backup = {
  get(key: any) {
    return ipcRenderer.sendSync('electron-backup-get', key)
  },
  set() {
    ipcRenderer.send('electron-backup-set')
  },
  // 恢复数据后清除 preload 层缓存
  clearCache() {
    cache = {}
    cacheInitialized = false
  }
}

// 用于暴漏给js的属性或方法 此处定义的值需要到types/gloabal.d.ts定义类型
contextBridge.exposeInMainWorld('electronAPI', {
  platform: os.platform(),
  store,
  backup,
})
