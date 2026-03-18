<template>
  <view 
    class="drag-float-btn"
    :style="btnStyle"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @click="onClick"
  >
    <text class="add-icon">+</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  edgePadding?: number
}

const props = withDefaults(defineProps<Props>(), {
  edgePadding: 20
})

const emit = defineEmits<{
  click: []
}>()

// 状态
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const hasMoved = ref(false)
const windowWidth = ref(375)
const windowHeight = ref(667)
const btnSize = ref(50)
const safeAreaBottom = ref(0)

// 按钮样式
const btnStyle = computed(() => ({
  left: position.value.x + 'px',
  top: position.value.y + 'px'
}))

// 点击事件
const onClick = () => {
  // 只有在没有移动时才触发点击
  if (!hasMoved.value) {
    emit('click')
  }
}

// 触摸开始
const onTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  dragStartPos.value = {
    x: touch.clientX - position.value.x,
    y: touch.clientY - position.value.y
  }
  isDragging.value = true
  hasMoved.value = false
}

// 触摸移动
const onTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  
  e.preventDefault()
  
  const touch = e.touches[0]
  let newX = touch.clientX - dragStartPos.value.x
  let newY = touch.clientY - dragStartPos.value.y
  
  // 计算边界
  const minX = props.edgePadding
  const maxX = windowWidth.value - btnSize.value - props.edgePadding
  const minY = props.edgePadding
  const maxY = windowHeight.value - btnSize.value - props.edgePadding - safeAreaBottom.value
  
  // 限制在屏幕范围内
  newX = Math.max(minX, Math.min(maxX, newX))
  newY = Math.max(minY, Math.min(maxY, newY))
  
  // 判断是否移动了
  const dx = Math.abs(newX - position.value.x)
  const dy = Math.abs(newY - position.value.y)
  if (dx > 5 || dy > 5) {
    hasMoved.value = true
  }
  
  position.value.x = newX
  position.value.y = newY
}

// 触摸结束
const onTouchEnd = () => {
  if (isDragging.value) {
    isDragging.value = false
    // 保存位置
    savePosition()
  }
}

// 保存位置
const savePosition = () => {
  try {
    uni.setStorageSync('float_btn_position', {
      x: position.value.x,
      y: position.value.y
    })
  } catch (e) {
    console.log('保存位置失败', e)
  }
}

// 加载位置
const loadPosition = () => {
  try {
    const saved = uni.getStorageSync('float_btn_position')
    if (saved) {
      const maxX = windowWidth.value - btnSize.value - props.edgePadding
      const maxY = windowHeight.value - btnSize.value - props.edgePadding - safeAreaBottom.value
      
      if (saved.x >= props.edgePadding && saved.x <= maxX &&
          saved.y >= props.edgePadding && saved.y <= maxY) {
        position.value.x = saved.x
        position.value.y = saved.y
        return
      }
    }
  } catch (e) {
    console.log('加载位置失败', e)
  }
  
  // 默认位置
  position.value.x = windowWidth.value - btnSize.value - props.edgePadding
  position.value.y = windowHeight.value - btnSize.value - props.edgePadding - safeAreaBottom.value
}

onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  windowWidth.value = systemInfo.windowWidth
  windowHeight.value = systemInfo.windowHeight
  safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0
  
  // 计算按钮实际大小: 100rpx 转换为 px
  btnSize.value = 100 * (windowWidth.value / 750)
  
  // 加载保存的位置
  loadPosition()
})
</script>

<style scoped>
.drag-float-btn {
  position: fixed;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.drag-float-btn:active {
  transform: scale(0.9);
  box-shadow: 0 4rpx 12rpx rgba(255, 154, 158, 0.3);
}

.add-icon {
  font-size: 56rpx;
  color: #fff;
  font-weight: 200;
  line-height: 1;
  pointer-events: none;
}
</style>
