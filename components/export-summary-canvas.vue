<template>
  <!-- 离屏画布，用于导出课时小结图片 -->
  <canvas
    canvas-id="summaryCanvas"
    id="summaryCanvas"
    class="summary-canvas"
    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, nextTick, getCurrentInstance } from 'vue'
import dayjs from 'dayjs'

interface SummaryStudent {
  studentName: string
  totalHours: string
}

interface SummaryGroup {
  teacherName: string
  totalHours: string
  students: SummaryStudent[]
}

interface SummaryData {
  title?: string
  periodText: string
  totalHours: string
  groups: SummaryGroup[]
}

// 导出图片布局常量
const EXPORT_W = 640
const EXPORT_P = 30
const HEADER_CARD_H = 140
const STU_ROW_H = 40

const canvasWidth = ref(EXPORT_W)
const canvasHeight = ref(400)

// 组件内 canvas 需传入组件实例，createCanvasContext/canvasToTempFilePath 才能定位到
const instance = getCurrentInstance()

// 单个老师卡片高度（学生两列排布）
const groupCardHeight = (studentCount: number) => {
  const rows = Math.ceil(studentCount / 2)
  return 108 + Math.max(0, rows - 1) * STU_ROW_H
}

// 绘制圆角矩形路径
const roundRect = (ctx: any, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// 保存图片到相册（兼容不支持长按保存的平台，如支付宝小程序）
const saveImageToAlbum = (filePath: string) => {
  uni.saveImageToPhotosAlbum({
    filePath,
    success: () => {
      uni.hideLoading()
      uni.showToast({ title: '已保存到相册', icon: 'success' })
    },
    fail: (err) => {
      uni.hideLoading()
      const msg = (err && err.errMsg) || ''
      // 用户拒绝授权时引导去设置开启
      if (/auth|deny|authorize|permission/i.test(msg)) {
        uni.showModal({
          title: '无法保存',
          content: '需要相册权限才能保存图片，请在设置中开启后重试',
          confirmText: '去设置',
          confirmColor: '#ff6b7a',
          success: (res) => {
            if (res.confirm) uni.openSetting()
          }
        })
      } else if (!/cancel/i.test(msg)) {
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    }
  })
}

const drawSummary = (W: number, H: number, data: SummaryData) => {
  const ctx = uni.createCanvasContext('summaryCanvas', instance?.proxy as any)
  const P = EXPORT_P

  // 整体浅粉背景
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#fff5f6')
  bg.addColorStop(1, '#fdf2f8')
  ctx.setFillStyle(bg)
  ctx.fillRect(0, 0, W, H)

  // 顶部渐变卡片
  const headerGrad = ctx.createLinearGradient(P, 0, W - P, 0)
  headerGrad.addColorStop(0, '#ff7b8a')
  headerGrad.addColorStop(1, '#ff9aa2')
  ctx.setFillStyle(headerGrad)
  roundRect(ctx, P, P, W - 2 * P, HEADER_CARD_H, 20)
  ctx.fill()

  // 头部文字：左右两组共用同一基线，做到上下对齐
  const topY = P + 62
  const bottomY = P + 106
  const hx = P + 30
  const hr = W - P - 30

  // 左：标题 + 期间
  ctx.setTextAlign('left')
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(32)
  ctx.fillText(data.title || '课时小结', hx, topY)
  ctx.setFontSize(22)
  ctx.setFillStyle('rgba(255,255,255,0.9)')
  ctx.fillText(data.periodText, hx, bottomY)

  // 右：总课时（整体上移 2px 做视觉微调）
  ctx.setTextAlign('right')
  ctx.setFillStyle('rgba(255,255,255,0.85)')
  ctx.setFontSize(20)
  ctx.fillText('总课时', hr, topY - 2)
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(34)
  ctx.fillText(`${data.totalHours} 小时`, hr, bottomY - 2)

  // 各老师卡片（学生两列，姓名与课时相邻）
  const innerLeft = P + 30
  const innerRight = W - P - 30
  const colGap = 30 // 两列之间的间隔
  const colW = (innerRight - innerLeft - colGap) / 2

  let y = P + HEADER_CARD_H + 22
  data.groups.forEach(g => {
    const cardH = groupCardHeight(g.students.length)
    const cardTop = y

    // 卡片背景
    ctx.setFillStyle('#ffffff')
    roundRect(ctx, P, cardTop, W - 2 * P, cardH, 16)
    ctx.fill()

    // 老师圆点 + 名称 + 合计
    const tb = cardTop + 40
    ctx.setFillStyle('#ff6b7a')
    ctx.beginPath()
    ctx.arc(innerLeft + 4, tb - 8, 7, 0, 2 * Math.PI)
    ctx.fill()
    ctx.setTextAlign('left')
    ctx.setFillStyle('#1f2937')
    ctx.setFontSize(26)
    ctx.fillText(g.teacherName, innerLeft + 24, tb)
    ctx.setTextAlign('right')
    ctx.setFillStyle('#ff6b7a')
    ctx.setFontSize(22)
    ctx.fillText(`${g.totalHours} 小时`, innerRight, tb)

    // 学生（每行两个，各占一半：姓名左对齐、课时紧随姓名）
    const s0 = cardTop + 84
    g.students.forEach((s, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const nameX = col === 0 ? innerLeft : innerLeft + colW + colGap
      // 课时右对齐到靠近姓名的位置（而非本列最右边缘）
      const valRightX = nameX + 170
      const rowY = s0 + row * STU_ROW_H
      // 姓名左对齐
      ctx.setTextAlign('left')
      ctx.setFillStyle('#4b5563')
      ctx.setFontSize(22)
      ctx.fillText(s.studentName, nameX, rowY)
      // 课时右对齐
      ctx.setTextAlign('right')
      ctx.setFillStyle('#9ca3af')
      ctx.fillText(`${s.totalHours}h`, valRightX, rowY)
    })

    y = cardTop + cardH + 18
  })

  // 底部落款（居中）
  ctx.setTextAlign('center')
  ctx.setFillStyle('#b0a5a8')
  ctx.setFontSize(18)
  ctx.fillText(`课时记录 · 导出于 ${dayjs().format('YYYY-MM-DD')}`, W / 2, H - 22)

  ctx.draw(false, () => {
    // draw 完成后再导出，部分平台需要短暂延时；输出 2 倍分辨率更清晰
    setTimeout(() => {
      uni.canvasToTempFilePath({
        canvasId: 'summaryCanvas',
        width: W,
        height: H,
        destWidth: W * 2,
        destHeight: H * 2,
        success: (res) => {
          saveImageToAlbum(res.tempFilePath)
        },
        fail: (err) => {
          uni.hideLoading()
          console.error('导出图片失败', err)
          uni.showToast({ title: '导出失败', icon: 'none' })
        }
      }, instance?.proxy as any)
    }, 120)
  })
}

// 对外暴露：生成并保存小结图片
const exportImage = async (data: SummaryData) => {
  if (!data.groups || data.groups.length === 0) {
    uni.showToast({ title: '暂无数据可导出', icon: 'none' })
    return
  }

  const W = EXPORT_W
  // 头部卡片 + 各老师卡片（学生两列）+ 底部落款
  let H = EXPORT_P + HEADER_CARD_H + 22
  data.groups.forEach(g => {
    H += groupCardHeight(g.students.length) + 18
  })
  H += 52

  canvasWidth.value = W
  canvasHeight.value = H
  await nextTick()
  uni.showLoading({ title: '生成中...' })
  // 等待画布尺寸生效后再绘制
  setTimeout(() => drawSummary(W, H, data), 80)
}

defineExpose({ exportImage })
</script>

<style scoped>
/* 离屏画布：移出可视区域但保留渲染 */
.summary-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
}
</style>
