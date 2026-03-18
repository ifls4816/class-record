<template>
  <view>
    <!-- 遮罩层 - 使用 catchtouchmove 阻止触摸穿透 -->
    <view 
      class="popup-mask" 
      v-show="visible" 
      :class="{ 'show': visible }" 
      @click="handleMaskClick"
      @touchmove.stop.prevent="preventTouchMove"
    ></view>
    
    <!-- 弹窗容器 -->
    <view class="popup-container" :class="{ 'show': visible }" @touchmove.stop="preventTouchMove">
      <!-- 头部 -->
      <view class="popup-header">
        <text class="popup-title">{{ title }}</text>
        <text class="popup-close" @click="handleClose">×</text>
      </view>
      
      <!-- 内容区域 -->
      <scroll-view scroll-y class="popup-scroll" @touchmove.stop>
        <view class="popup-content">
          <slot></slot>

          <!-- 底部按钮 -->
          <button v-if="submitText" class="submit-btn" @click="handleSubmit">
            {{ submitText }}
          </button>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'

interface Props {
  visible?: boolean
  title?: string
  submitText?: string
  maskClosable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '标题',
  submitText: '确认',
  maskClosable: true
})

const emit = defineEmits<{
  close: []
  submit: []
  visibleChange: [visible: boolean]
}>()

// 阻止触摸移动
const preventTouchMove = () => {
  // 空函数，仅用于阻止事件
}

// 监听弹窗显示状态，控制页面滚动
watch(() => props.visible, (newVal) => {
  // 通知父组件弹窗状态变化
  emit('visibleChange', newVal)
  
  // 微信小程序: 使用 setPageStyle
  if (typeof uni.setPageStyle === 'function') {
    uni.setPageStyle({
      style: {
        overflow: newVal ? 'hidden' : 'auto'
      }
    })
  }
}, { immediate: true })

// 处理遮罩层点击
const handleMaskClick = () => {
  if (props.maskClosable) {
    handleClose()
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
}

// 提交
const handleSubmit = () => {
  emit('submit')
}
</script>

<style scoped>
/* 遮罩层 */
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.popup-mask.show {
  opacity: 1;
  pointer-events: auto;
}

/* 弹窗容器 */
.popup-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  z-index: 1001;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.popup-container.show {
  transform: translateY(0);
}

/* 头部 */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #fce7f3;
  flex-shrink: 0;
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
  padding: 0 8rpx;
}

/* 滚动区域 */
.popup-scroll {
  flex: 1;
  overflow-y: auto;
}

/* 内容区域 */
.popup-content {
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

/* 提交按钮 */
.submit-btn {
  margin-top: 32rpx;
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #ff7b8a 0%, #ff9aa2 100%);
  border-radius: 44rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(255, 123, 138, 0.35);
  transition: all 0.2s ease;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(255, 123, 138, 0.25);
}

.submit-btn::after {
  border: none;
}
</style>
