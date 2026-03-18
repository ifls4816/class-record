<template>
  <view class="container">
    <!-- WebDAV 同步 -->
    <view class="section">
      <view class="section-title">WebDAV 同步</view>
      
      <view class="menu-list">
        <view class="menu-item" @click="showWebDAVConfig">
          <view class="menu-content">
            <view class="menu-label">WebDAV 配置</view>
            <view class="menu-desc">{{ webdavStatusText }}</view>
          </view>
          <view class="menu-arrow">›</view>
        </view>

        <view class="menu-item" v-if="isWebDAVConfigured" @click="syncNow">
          <view class="menu-content">
            <view class="menu-label">立即同步</view>
            <view class="menu-desc">上传数据到 WebDAV</view>
          </view>
          <view class="menu-arrow">›</view>
        </view>

        <view class="menu-item" v-if="isWebDAVConfigured" @click="downloadFromCloud">
          <view class="menu-content">
            <view class="menu-label">从云端恢复</view>
            <view class="menu-desc">下载 WebDAV 数据</view>
          </view>
          <view class="menu-arrow">›</view>
        </view>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="section">
      <view class="section-title">本地备份</view>
      
      <view class="menu-list">
        <view class="menu-item" @click="backupData">
          <view class="menu-content">
            <view class="menu-label">备份数据</view>
            <view class="menu-desc">导出所有数据到剪贴板</view>
          </view>
          <view class="menu-arrow">›</view>
        </view>

        <view class="menu-item" @click="restoreData">
          <view class="menu-content">
            <view class="menu-label">恢复数据</view>
            <view class="menu-desc">从剪贴板导入数据</view>
          </view>
          <view class="menu-arrow">›</view>
        </view>
      </view>
    </view>

    <!-- WebDAV 配置弹窗 -->
    <view class="popup-mask" v-if="showWebDAVPopup" @click="showWebDAVPopup = false"></view>
    <view class="popup-container" :class="{ 'show': showWebDAVPopup }">
      <view class="popup-header">
        <text class="popup-title">WebDAV 配置</text>
        <text class="popup-close" @click="showWebDAVPopup = false">×</text>
      </view>

      <view class="popup-content">
        <view class="form-item">
          <text class="form-label">服务器地址</text>
          <input 
            class="form-input"
            v-model="webdavForm.url"
            placeholder="例如: https://dav.jianguoyun.com/dav/"
            placeholder-style="color: #9ca3af;"
          />
        </view>

        <view class="form-item">
          <text class="form-label">用户名</text>
          <input 
            class="form-input"
            v-model="webdavForm.username"
            placeholder="请输入用户名"
            placeholder-style="color: #9ca3af;"
          />
        </view>

        <view class="form-item">
          <text class="form-label">密码</text>
          <input 
            class="form-input"
            v-model="webdavForm.password"
            placeholder="请输入密码"
            placeholder-style="color: #9ca3af;"
            password
          />
        </view>

        <view class="popup-actions">
          <button class="btn-test" @click="testConnection">测试连接</button>
          <button class="btn-save" @click="saveWebDAVConfig">保存配置</button>
        </view>

        <view class="popup-actions" v-if="isWebDAVConfigured">
          <button class="btn-clear" @click="clearWebDAVConfig">清除配置</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/store'
import { storeToRefs } from 'pinia'
import { 
  getWebDAVConfig, 
  saveWebDAVConfig as saveConfig, 
  clearWebDAVConfig as clearConfig,
  testWebDAVConnection,
  isWebDAVConfigured as checkWebDAVConfigured 
} from '@/utils/webdav'
import type { WebDAVConfig, StorageData } from '@/types'

const store = useAppStore()
const { students, classData, totalRecords } = storeToRefs(store)

// WebDAV 弹窗
const showWebDAVPopup = ref(false)
const webdavForm = ref<WebDAVConfig>({
  url: '',
  username: '',
  password: ''
})

// 用于触发界面更新的响应式标记
const webdavConfigVersion = ref(0)

// WebDAV 是否已配置
const isWebDAVConfigured = computed(() => {
  // 依赖 webdavConfigVersion 触发更新
  void webdavConfigVersion.value
  return checkWebDAVConfigured()
})

// WebDAV 状态文本
const webdavStatusText = computed(() => {
  // 依赖 webdavConfigVersion 触发更新
  void webdavConfigVersion.value
  const config = getWebDAVConfig()
  return config ? `已配置 (${config.username})` : '未配置'
})

// 显示 WebDAV 配置弹窗
const showWebDAVConfig = () => {
  const config = getWebDAVConfig()
  if (config) {
    webdavForm.value = { ...config }
  } else {
    webdavForm.value = { url: '', username: '', password: '' }
  }
  showWebDAVPopup.value = true
}

// 测试连接
const testConnection = async () => {
  if (!webdavForm.value.url || !webdavForm.value.username || !webdavForm.value.password) {
    uni.showToast({ title: '请填写完整配置', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '测试中...' })
  const success = await testWebDAVConnection(webdavForm.value)
  uni.hideLoading()
  
  if (success) {
    uni.showToast({ title: '连接成功', icon: 'success' })
  } else {
    uni.showToast({ title: '连接失败', icon: 'none' })
  }
}

// 保存 WebDAV 配置
const saveWebDAVConfig = () => {
  if (!webdavForm.value.url || !webdavForm.value.username || !webdavForm.value.password) {
    uni.showToast({ title: '请填写完整配置', icon: 'none' })
    return
  }
  
  saveConfig(webdavForm.value)
  webdavConfigVersion.value++ // 触发界面更新
  showWebDAVPopup.value = false
  uni.showToast({ title: '保存成功', icon: 'success' })
}

// 清除 WebDAV 配置
const clearWebDAVConfig = () => {
  uni.showModal({
    title: '确认清除',
    content: '确定要清除 WebDAV 配置吗?',
    confirmColor: '#ff6b7a',
    success: (res) => {
      if (res.confirm) {
        clearConfig()
        webdavForm.value = { url: '', username: '', password: '' }
        webdavConfigVersion.value++ // 触发界面更新
        showWebDAVPopup.value = false
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    }
  })
}

// 立即同步
const syncNow = async () => {
  uni.showLoading({ title: '同步中...' })
  const success = await store.syncToWebDAV()
  uni.hideLoading()
  
  uni.showToast({ 
    title: success ? '同步成功' : '同步失败', 
    icon: success ? 'success' : 'none' 
  })
}

// 从云端恢复
const downloadFromCloud = async () => {
  uni.showModal({
    title: '从云端恢复',
    content: '这将覆盖本地数据，确定要继续吗?',
    confirmColor: '#ff6b7a',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '恢复中...' })
        const success = await store.syncFromWebDAV()
        uni.hideLoading()
        
        uni.showToast({ 
          title: success ? '恢复成功' : '恢复失败', 
          icon: success ? 'success' : 'none' 
        })
      }
    }
  })
}

// 备份数据
const backupData = () => {
  const data: StorageData = {
    students: students.value,
    classData: classData.value,
    backupTime: new Date().toISOString(),
    version: '2.0.0'
  }
  
  const dataStr = JSON.stringify(data)
  
  uni.setClipboardData({
    data: dataStr,
    success: () => {
      uni.showModal({
        title: '备份成功',
        content: `数据已复制到剪贴板,请保存到安全的地方。\n\n学生数量: ${students.value.length}\n课程记录: ${totalRecords.value}`,
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#ff6b7a'
      })
    }
  })
}

// 恢复数据
const restoreData = () => {
  uni.showModal({
    title: '恢复数据',
    content: '请确保剪贴板中有有效的备份数据,恢复将覆盖当前数据。',
    confirmColor: '#ff6b7a',
    success: (res) => {
      if (res.confirm) {
        uni.getClipboardData({
          success: (result) => {
            try {
              const data = JSON.parse(result.data) as StorageData

              // 验证基本字段存在
              if (!data.students || !Array.isArray(data.students)) {
                throw new Error('学生数据格式错误')
              }
              if (!data.classData || typeof data.classData !== 'object') {
                throw new Error('课程数据格式错误')
              }

              // 验证学生数据结构
              for (const student of data.students) {
                if (typeof student.id !== 'number' || typeof student.name !== 'string') {
                  throw new Error('学生数据结构不完整')
                }
              }

              // 验证课程数据结构
              for (const yearKey in data.classData) {
                const yearData = data.classData[Number(yearKey)]
                if (!yearData || typeof yearData !== 'object') continue

                for (const monthKey in yearData) {
                  const monthData = yearData[Number(monthKey)]
                  if (!monthData || typeof monthData !== 'object') continue

                  for (const dayKey in monthData) {
                    const dayRecords = monthData[Number(dayKey)]
                    if (!Array.isArray(dayRecords)) {
                      throw new Error('课程数据结构不完整')
                    }
                  }
                }
              }

              store.restoreData(data)
              uni.showToast({ title: '恢复成功', icon: 'success' })
            } catch (e) {
              const errorMsg = e instanceof Error ? e.message : '数据格式错误'
              uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
            }
          },
          fail: () => {
            uni.showToast({ title: '读取剪贴板失败', icon: 'none' })
          }
        })
      }
    }
  })
}

</script>

<style scoped>
.container {
  padding-bottom: 40rpx;
}

.section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
}

.menu-list {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(255, 182, 193, 0.12);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  transition: all 0.2s ease;
  position: relative;
}

.menu-item::after {
  content: '';
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  bottom: 0;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #fce7f3, transparent);
}

.menu-item:last-child::after {
  display: none;
}

.menu-item:active {
  background: linear-gradient(135deg, #ffeef0 0%, #ffdce0 100%);
}

.menu-content {
  flex: 1;
}

.menu-label {
  font-size: 30rpx;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4rpx;
}

.menu-desc {
  font-size: 24rpx;
  color: #9ca3af;
}

.menu-arrow {
  font-size: 32rpx;
  color: #d1d5db;
}

/* 弹窗 */
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.popup-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  z-index: 1001;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.popup-container.show {
  transform: translateY(0);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #fce7f3;
}

.popup-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f2937;
}

.popup-close {
  font-size: 48rpx;
  color: #9ca3af;
  line-height: 1;
}

.popup-content {
  padding: 32rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.form-input {
  background: #fef1f2;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  font-size: 30rpx;
  color: #1f2937;
  width: 100%;
  box-sizing: border-box;
  height: 88rpx;
  line-height: 40rpx;
}

.popup-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.btn-test {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-radius: 44rpx;
  color: #666;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-save {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(135deg, #ff7b8a 0%, #ff9aa2 100%);
  border-radius: 44rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(255, 123, 138, 0.35);
}

.btn-clear {
  flex: 1;
  height: 88rpx;
  background: #f3f4f6;
  border-radius: 44rpx;
  color: #6b7280;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
</style>
