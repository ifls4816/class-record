/**
 * WebDAV 工具模块
 * 用于数据同步到 WebDAV 服务器
 */
import type { WebDAVConfig, StorageData } from '@/types'

const WEBDAV_CONFIG_KEY = 'webdav_config'
const DATA_FILE_NAME = 'class-record-data.json'

/**
 * 获取 WebDAV 配置
 */
export function getWebDAVConfig(): WebDAVConfig | null {
  try {
    const config = uni.getStorageSync(WEBDAV_CONFIG_KEY) as WebDAVConfig | null
    if (config && config.url && config.username && config.password) {
      return config
    }
    return null
  } catch (e) {
    console.error('获取 WebDAV 配置失败', e)
    return null
  }
}

/**
 * 保存 WebDAV 配置
 */
export function saveWebDAVConfig(config: WebDAVConfig): boolean {
  try {
    uni.setStorageSync(WEBDAV_CONFIG_KEY, config)
    return true
  } catch (e) {
    console.error('保存 WebDAV 配置失败', e)
    return false
  }
}

/**
 * 清除 WebDAV 配置
 */
export function clearWebDAVConfig(): boolean {
  try {
    uni.removeStorageSync(WEBDAV_CONFIG_KEY)
    return true
  } catch (e) {
    console.error('清除 WebDAV 配置失败', e)
    return false
  }
}

/**
 * 检查 WebDAV 配置是否有效
 */
export function isWebDAVConfigured(): boolean {
  return getWebDAVConfig() !== null
}

/**
 * 生成 Basic Auth 头
 */
function generateBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`
  return 'Basic ' + base64Encode(credentials)
}

/**
 * Base64 编码（小程序兼容）
 */
function base64Encode(str: string): string {
  // 通过 ArrayBuffer 转换（小程序支持）
  try {
    // 将字符串转为 UTF-8 字节数组
    const utf8Bytes: number[] = []
    for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i)
      if (charCode < 0x80) {
        utf8Bytes.push(charCode)
      } else if (charCode < 0x800) {
        utf8Bytes.push(0xc0 | (charCode >> 6))
        utf8Bytes.push(0x80 | (charCode & 0x3f))
      } else if (charCode < 0xd800 || charCode >= 0xe000) {
        utf8Bytes.push(0xe0 | (charCode >> 12))
        utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f))
        utf8Bytes.push(0x80 | (charCode & 0x3f))
      } else {
        // 处理代理对
        i++
        charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
        utf8Bytes.push(0xf0 | (charCode >> 18))
        utf8Bytes.push(0x80 | ((charCode >> 12) & 0x3f))
        utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f))
        utf8Bytes.push(0x80 | (charCode & 0x3f))
      }
    }
    
    // 创建 ArrayBuffer
    const buffer = new ArrayBuffer(utf8Bytes.length)
    const dataView = new DataView(buffer)
    for (let i = 0; i < utf8Bytes.length; i++) {
      dataView.setUint8(i, utf8Bytes[i])
    }
    
    // 使用小程序的 ArrayBuffer 转 Base64 方法
    if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) {
      return wx.arrayBufferToBase64(buffer)
    }
    if (typeof uni !== 'undefined' && uni.arrayBufferToBase64) {
      return uni.arrayBufferToBase64(buffer)
    }
  } catch (e) {
    console.warn('ArrayBuffer 方式编码失败', e)
  }
  
  // 纯 JavaScript 实现（备用）
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    
    const bitmap = (a << 16) | (b << 8) | c
    
    result += base64Chars[(bitmap >> 18) & 63]
    result += base64Chars[(bitmap >> 12) & 63]
    result += (i - 2 < str.length) ? base64Chars[(bitmap >> 6) & 63] : '='
    result += (i - 1 < str.length) ? base64Chars[bitmap & 63] : '='
  }
  
  return result
}

/**
 * 上传数据到 WebDAV
 */
export async function uploadToWebDAV(data: StorageData): Promise<boolean> {
  const config = getWebDAVConfig()
  if (!config) {
    console.warn('WebDAV 未配置')
    return false
  }

  const { url, username, password } = config
  
  // 确保URL以/结尾
  const baseUrl = url.endsWith('/') ? url : url + '/'
  const fileUrl = baseUrl + DATA_FILE_NAME

  try {
    // 压缩 JSON（不使用格式化，减少体积）
    const jsonData = JSON.stringify(data)
    const authHeader = generateBasicAuth(username, password)
    
    return new Promise((resolve) => {
      uni.request({
        url: fileUrl,
        method: 'PUT',
        data: jsonData,
        header: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('WebDAV 上传成功')
            resolve(true)
          } else {
            console.error('WebDAV 上传失败，状态码:', res.statusCode)
            resolve(false)
          }
        },
        fail: (err) => {
          console.error('WebDAV 上传请求失败', err)
          resolve(false)
        }
      })
    })
  } catch (e) {
    console.error('WebDAV 上传异常', e)
    return false
  }
}

/**
 * 从 WebDAV 下载数据
 */
export async function downloadFromWebDAV(): Promise<StorageData | null> {
  const config = getWebDAVConfig()
  if (!config) {
    console.warn('WebDAV 未配置')
    return null
  }

  const { url, username, password } = config
  
  // 确保URL以/结尾
  const baseUrl = url.endsWith('/') ? url : url + '/'
  const fileUrl = baseUrl + DATA_FILE_NAME

  try {
    const authHeader = generateBasicAuth(username, password)

    return new Promise((resolve) => {
      uni.request({
        url: fileUrl,
        method: 'GET',
        header: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            console.log('WebDAV 下载成功')
            // 兼容 class 和 classData 两种格式
            const data = res.data as any
            const downloadData: StorageData = {
              students: data.students,
              classData: data.classData || data.class
            }
            resolve(downloadData)
          } else if (res.statusCode === 404) {
            console.warn('WebDAV 文件不存在')
            resolve(null)
          } else {
            console.error('WebDAV 下载失败，状态码:', res.statusCode)
            resolve(null)
          }
        },
        fail: (err) => {
          console.error('WebDAV 下载请求失败', err)
          resolve(null)
        }
      })
    })
  } catch (e) {
    console.error('WebDAV 下载异常', e)
    return null
  }
}

/**
 * 测试 WebDAV 连接
 * 通过写入测试文件验证连接
 */
export async function testWebDAVConnection(config: WebDAVConfig): Promise<boolean> {
  const { url, username, password } = config
  
  // 确保URL以/结尾
  const baseUrl = url.endsWith('/') ? url : url + '/'
  const testFileUrl = baseUrl + 'test-connection.json'
  
  try {
    const authHeader = generateBasicAuth(username, password)
    const testContent = JSON.stringify({ test: true, time: new Date().toISOString() })
    
    return new Promise((resolve) => {
      uni.request({
        url: testFileUrl,
        method: 'PUT',
        data: testContent,
        header: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('WebDAV 连接测试成功')
            resolve(true)
          } else if (res.statusCode === 401) {
            console.error('认证失败，请检查用户名和密码')
            resolve(false)
          } else if (res.statusCode === 403) {
            console.error('权限不足，无法写入该目录')
            resolve(false)
          } else {
            console.error('WebDAV 连接测试失败，状态码:', res.statusCode)
            resolve(false)
          }
        },
        fail: (err) => {
          console.error('WebDAV 连接测试请求失败', err)
          resolve(false)
        }
      })
    })
  } catch (e) {
    console.error('WebDAV 连接测试异常', e)
    return false
  }
}
