import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import Store from 'electron-store'

// 主线程初始化electron-store
const store = new Store()
// 监听store方法
ipcMain.on('electron-store-get', async (event, key) => {
  event.returnValue = store.get(key)
})
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val)
})
ipcMain.on('electron-store-del', async (event, key) => {
  store.delete(key)
})
// 备份数据
ipcMain.on('electron-backup-set', async () => {
  const fs = await import('fs')
  const formatDateTime = (date: Date) => {
    const padZero = (num: number): string => num.toString().padStart(2, '0')
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${padZero(month)}-${padZero(day)}`
  }

  const filename = `record-${formatDateTime(new Date())}`
  const filters = [
    {
      name: filename,
      extensions: ['json'], // 文件后缀名类型， 如md
    },
  ]
  dialog
    .showSaveDialog({
      filters,
      defaultPath: filename,
      title: '备份数据',
      buttonLabel: '导出',
    })
    .then((result) => {
      if (result.canceled) return
      const content = store.store
      fs.writeFileSync(result.filePath as any, JSON.stringify(content), 'utf8')
    })
    .catch((err) => {
      console.log('electron-backup-set-err', err)
    })
})
// 恢复数据
ipcMain.on('electron-backup-get', async (event) => {
  dialog
    .showOpenDialog({
      filters: [
        {
          name: 'json格式文件',
          extensions: ['json'],
        },
      ],
      properties: ['openFile'],
      message: '请选择你要导入的json格式文件',
      buttonLabel: '导入',
    })
    .then(async (result) => {
      // 点击取消什么也不做
      if (result.canceled) {
        return (event.returnValue = JSON.stringify(result))
      }
      const fs = await import('fs')
      const data = fs.readFileSync(result.filePaths[0], 'utf-8')
      event.returnValue = data
    })
    .catch((err) => {
      console.log('electron-backup-get-err', err)
    })
})

// console.log(app.getPath('userData')) // /Users/admin/Library/Application Support/electron-desktop

const createWindow = () => {
  const win = new BrowserWindow({
    title: '课时记录',
    width: 800,
    minWidth: 800,
    height: 645,
    minHeight: 645,
    frame: true,
    transparent: false,
    // frame: app.isPackaged ? false : true,
    webPreferences: {
      preload: path.join(__dirname, './preload/index.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  // 开启控制台
  // win.webContents.openDevTools()

  win.on('resize', () => {
    win.reload()
  })

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../index.html'))
  } else {
    // Use ['ENV_NAME'] avoid vite:define plugin
    win.loadURL(process.env.VITE_DEV_SERVER_URL as string)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // process.platform === 'darwin' && app.dock.show() // 展示dock图标
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// app.on('before-quit', () => {
// app.dock.hide(); // 隐藏 Dock 中的图标
// });

app.on('window-all-closed', () => {
  // process.platform === 'darwin' && app.dock.hide()
  // if (process.platform !== 'darwin') {
  app.quit()
  // }
})
