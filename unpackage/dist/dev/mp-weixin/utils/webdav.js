"use strict";
const common_vendor = require("../common/vendor.js");
const WEBDAV_CONFIG_KEY = "webdav_config";
const DATA_FILE_NAME = "class-record-data.json";
function getWebDAVConfig() {
  try {
    const config = common_vendor.index.getStorageSync(WEBDAV_CONFIG_KEY);
    if (config && config.url && config.username && config.password) {
      return config;
    }
    return null;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/webdav.ts:21", "获取 WebDAV 配置失败", e);
    return null;
  }
}
function saveWebDAVConfig(config) {
  try {
    common_vendor.index.setStorageSync(WEBDAV_CONFIG_KEY, config);
    return true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/webdav.ts:34", "保存 WebDAV 配置失败", e);
    return false;
  }
}
function clearWebDAVConfig() {
  try {
    common_vendor.index.removeStorageSync(WEBDAV_CONFIG_KEY);
    return true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/webdav.ts:47", "清除 WebDAV 配置失败", e);
    return false;
  }
}
function isWebDAVConfigured() {
  return getWebDAVConfig() !== null;
}
function generateBasicAuth(username, password) {
  const credentials = `${username}:${password}`;
  return "Basic " + base64Encode(credentials);
}
function base64Encode(str) {
  try {
    const utf8Bytes = [];
    for (let i2 = 0; i2 < str.length; i2++) {
      let charCode = str.charCodeAt(i2);
      if (charCode < 128) {
        utf8Bytes.push(charCode);
      } else if (charCode < 2048) {
        utf8Bytes.push(192 | charCode >> 6);
        utf8Bytes.push(128 | charCode & 63);
      } else if (charCode < 55296 || charCode >= 57344) {
        utf8Bytes.push(224 | charCode >> 12);
        utf8Bytes.push(128 | charCode >> 6 & 63);
        utf8Bytes.push(128 | charCode & 63);
      } else {
        i2++;
        charCode = 65536 + ((charCode & 1023) << 10 | str.charCodeAt(i2) & 1023);
        utf8Bytes.push(240 | charCode >> 18);
        utf8Bytes.push(128 | charCode >> 12 & 63);
        utf8Bytes.push(128 | charCode >> 6 & 63);
        utf8Bytes.push(128 | charCode & 63);
      }
    }
    const buffer = new ArrayBuffer(utf8Bytes.length);
    const dataView = new DataView(buffer);
    for (let i2 = 0; i2 < utf8Bytes.length; i2++) {
      dataView.setUint8(i2, utf8Bytes[i2]);
    }
    if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.arrayBufferToBase64) {
      return common_vendor.wx$1.arrayBufferToBase64(buffer);
    }
    if (typeof common_vendor.index !== "undefined" && common_vendor.index.arrayBufferToBase64) {
      return common_vendor.index.arrayBufferToBase64(buffer);
    }
  } catch (e) {
    common_vendor.index.__f__("warn", "at utils/webdav.ts:112", "ArrayBuffer 方式编码失败", e);
  }
  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    const bitmap = a << 16 | b << 8 | c;
    result += base64Chars[bitmap >> 18 & 63];
    result += base64Chars[bitmap >> 12 & 63];
    result += i - 2 < str.length ? base64Chars[bitmap >> 6 & 63] : "=";
    result += i - 1 < str.length ? base64Chars[bitmap & 63] : "=";
  }
  return result;
}
async function uploadToWebDAV(data) {
  const config = getWebDAVConfig();
  if (!config) {
    common_vendor.index.__f__("warn", "at utils/webdav.ts:142", "WebDAV 未配置");
    return false;
  }
  const { url, username, password } = config;
  const baseUrl = url.endsWith("/") ? url : url + "/";
  const fileUrl = baseUrl + DATA_FILE_NAME;
  try {
    const jsonData = JSON.stringify(data);
    const authHeader = generateBasicAuth(username, password);
    return new Promise((resolve) => {
      common_vendor.index.request({
        url: fileUrl,
        method: "PUT",
        data: jsonData,
        header: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            common_vendor.index.__f__("log", "at utils/webdav.ts:168", "WebDAV 上传成功");
            resolve(true);
          } else {
            common_vendor.index.__f__("error", "at utils/webdav.ts:171", "WebDAV 上传失败，状态码:", res.statusCode);
            resolve(false);
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/webdav.ts:176", "WebDAV 上传请求失败", err);
          resolve(false);
        }
      });
    });
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/webdav.ts:182", "WebDAV 上传异常", e);
    return false;
  }
}
async function downloadFromWebDAV() {
  const config = getWebDAVConfig();
  if (!config) {
    common_vendor.index.__f__("warn", "at utils/webdav.ts:193", "WebDAV 未配置");
    return null;
  }
  const { url, username, password } = config;
  const baseUrl = url.endsWith("/") ? url : url + "/";
  const fileUrl = baseUrl + DATA_FILE_NAME;
  try {
    const authHeader = generateBasicAuth(username, password);
    return new Promise((resolve) => {
      common_vendor.index.request({
        url: fileUrl,
        method: "GET",
        header: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            common_vendor.index.__f__("log", "at utils/webdav.ts:216", "WebDAV 下载成功");
            const data = res.data;
            const downloadData = {
              students: data.students,
              classData: data.classData || data.class
            };
            resolve(downloadData);
          } else if (res.statusCode === 404) {
            common_vendor.index.__f__("warn", "at utils/webdav.ts:225", "WebDAV 文件不存在");
            resolve(null);
          } else {
            common_vendor.index.__f__("error", "at utils/webdav.ts:228", "WebDAV 下载失败，状态码:", res.statusCode);
            resolve(null);
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/webdav.ts:233", "WebDAV 下载请求失败", err);
          resolve(null);
        }
      });
    });
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/webdav.ts:239", "WebDAV 下载异常", e);
    return null;
  }
}
async function testWebDAVConnection(config) {
  const { url, username, password } = config;
  const baseUrl = url.endsWith("/") ? url : url + "/";
  const testFileUrl = baseUrl + "test-connection.json";
  try {
    const authHeader = generateBasicAuth(username, password);
    const testContent = JSON.stringify({ test: true, time: (/* @__PURE__ */ new Date()).toISOString() });
    return new Promise((resolve) => {
      common_vendor.index.request({
        url: testFileUrl,
        method: "PUT",
        data: testContent,
        header: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            common_vendor.index.__f__("log", "at utils/webdav.ts:270", "WebDAV 连接测试成功");
            resolve(true);
          } else if (res.statusCode === 401) {
            common_vendor.index.__f__("error", "at utils/webdav.ts:273", "认证失败，请检查用户名和密码");
            resolve(false);
          } else if (res.statusCode === 403) {
            common_vendor.index.__f__("error", "at utils/webdav.ts:276", "权限不足，无法写入该目录");
            resolve(false);
          } else {
            common_vendor.index.__f__("error", "at utils/webdav.ts:279", "WebDAV 连接测试失败，状态码:", res.statusCode);
            resolve(false);
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/webdav.ts:284", "WebDAV 连接测试请求失败", err);
          resolve(false);
        }
      });
    });
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/webdav.ts:290", "WebDAV 连接测试异常", e);
    return false;
  }
}
exports.clearWebDAVConfig = clearWebDAVConfig;
exports.downloadFromWebDAV = downloadFromWebDAV;
exports.getWebDAVConfig = getWebDAVConfig;
exports.isWebDAVConfigured = isWebDAVConfigured;
exports.saveWebDAVConfig = saveWebDAVConfig;
exports.testWebDAVConnection = testWebDAVConnection;
exports.uploadToWebDAV = uploadToWebDAV;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/webdav.js.map
