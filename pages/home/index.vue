<template>
  <view class="page-wrapper" :class="{ 'no-scroll': showPopup }" @touchmove="handlePageTouchMove">
    <view class="container">
    <!-- 日历卡片 -->
    <view class="card calendar-card">
      <view class="calendar-header">
        <view class="month-nav">
          <text class="nav-btn" @click="prevMonth">‹</text>
          <text class="month-title">{{ currentYear }}年{{ currentMonth }}月</text>
          <text class="nav-btn" @click="nextMonth">›</text>
        </view>
      </view>

      <!-- 星期标题 -->
      <view class="weekdays">
        <text class="weekday" v-for="day in weekDays" :key="day">{{ day }}</text>
      </view>

      <!-- 日期网格 -->
      <view class="days-grid">
        <view
          class="day-item"
          v-for="(day, index) in calendarDays"
          :key="day.dateStr || `empty-${index}`"
          :class="{
            'empty': !day.date,
            'today': day.isToday,
            'selected': day.dateStr === selectedDate,
            'has-record': day.hasRecord
          }"
          @click="selectDate(day)"
        >
          <text class="day-number">{{ day.date ? day.date.getDate() : '' }}</text>
          <view class="day-dots" v-if="day.hasRecord">
            <view class="day-dot normal" v-if="day.hasNormalRecord"></view>
            <view class="day-dot future" v-if="day.hasFutureRecord"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 当日课程列表 -->
    <view class="section-title" v-if="selectedDate">
      <text class="title-text">{{ selectedDateStr }}的课程</text>
      <text class="title-count">{{ todayRecords.length }}节</text>
    </view>

    <view v-if="todayRecords.length > 0" class="record-list">
      <view 
        class="record-item fade-in" 
        :class="{ 'future-record': record.isFuture }"
        v-for="(record, index) in todayRecords" 
        :key="`${record.studentId}-${record.time[0]}-${index}`"
        @longpress="showActionSheet(record, index)"
      >
        <view class="record-left">
          <view class="record-time">
            <image class="time-icon" src="/static/icon/time.png" mode="aspectFit" />
            <text class="time-text">{{ record.time[0] }} - {{ record.time[1] }}</text>
          </view>
          <view class="student-name">
            <image class="name-icon" src="/static/icon/people.png" mode="aspectFit" />
            <text>{{ getStudentName(record.studentId) }}</text>
            <text v-if="record.isFuture" class="future-tag">未上课</text>
          </view>
        </view>
        <view class="record-right">
          <text class="duration-tag">{{ record.timeDiff }}分钟</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-state fade-in">
      <text class="empty-text">今天还没有课程记录哦~</text>
    </view>

    <!-- 可拖动浮动按钮 -->
    <drag-float-btn @click="showAddPopup" />

    <!-- 添加课程弹窗 -->
    <popup-modal
      :visible="showPopup"
      :title="isEdit ? '编辑记录' : '添加记录'"
      :submitText="isEdit ? '保存修改' : '确认添加'"
      @close="closePopup"
      @submit="submitRecord"
    >
      <!-- 学生选择 -->
      <view class="form-item">
        <text class="form-label">选择学生</text>
        <picker mode="selector" :range="activeStudentNames" @change="onStudentChange">
          <view class="picker-value">
            {{ selectedStudentName || '请选择学生' }}
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 日期选择 -->
      <view class="form-item">
        <text class="form-label">上课日期</text>
        <picker mode="date" :value="recordForm.date" @change="onDateChange">
          <view class="picker-value">
            {{ recordForm.date || '请选择日期' }}
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 时间选择 -->
      <view class="form-item">
        <text class="form-label">上课时间</text>
        <view class="time-row">
          <view class="time-picker-wrapper">
            <picker mode="time" :value="recordForm.startTime" @change="onStartTimeChange">
              <view class="picker-value time-picker">
                {{ recordForm.startTime || '开始' }}
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
          <text class="time-separator">-</text>
          <view class="time-picker-wrapper">
            <picker mode="time" :value="recordForm.endTime" @change="onEndTimeChange">
              <view class="picker-value time-picker">
                {{ recordForm.endTime || '结束' }}
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 预计时长 -->
      <view class="duration-preview" v-if="recordForm.startTime && recordForm.endTime">
        <text class="preview-label">课时:</text>
        <text class="preview-value">{{ calculatedDuration }}分钟</text>
        
        <!-- 未来课时开关 -->
        <view class="future-switch">
          <switch 
            :checked="recordForm.isFuture" 
            @change="onFutureChange"
            color="#ff7b8a"
            style="transform: scale(0.7);"
          />
          <text class="future-label">未上课</text>
        </view>
      </view>
    </popup-modal>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import DragFloatBtn from '@/components/drag-float-btn.vue'
import PopupModal from '@/components/popup-modal.vue'
import { useAppStore } from '@/store'
import { storeToRefs } from 'pinia'
import type { TodayClass } from '@/types'
import { parseDate, calculateTimeDiff } from '@/utils/common'

const store = useAppStore()
const { students, classData, activeStudents } = storeToRefs(store)

// 日历相关
const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month() + 1)
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 弹窗相关
const showPopup = ref(false)
const isEdit = ref(false)
const editingRecordIndex = ref(-1)
const currentRecord = ref<TodayClass | null>(null)
const currentRecordIndex = ref(-1)

// 表单数据
const recordForm = ref({
  studentId: null as number | null,
  date: dayjs().format('YYYY-MM-DD'),
  startTime: '',
  endTime: '',
  isFuture: false
})

// 日历数据
interface CalendarDay {
  date: Date | null
  dateStr: string
  isToday: boolean
  hasRecord: boolean
  hasFutureRecord: boolean
  hasNormalRecord: boolean
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay()
  
  const days: CalendarDay[] = []
  
  // 填充空白
  for (let i = 0; i < startWeekday; i++) {
    days.push({ 
      date: null, 
      dateStr: '', 
      isToday: false, 
      hasRecord: false, 
      hasFutureRecord: false,
      hasNormalRecord: false
    })
  }
  
  // 填充日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i)
    const dateStr = dayjs(date).format('YYYY-MM-DD')
    const today = dayjs().format('YYYY-MM-DD')
    const records = getRecordsOnDate(dateStr)
    const hasFuture = records.some(r => r.isFuture)
    const hasNormal = records.some(r => !r.isFuture)
    
    days.push({
      date: date,
      dateStr: dateStr,
      isToday: dateStr === today,
      hasRecord: records.length > 0,
      hasFutureRecord: hasFuture,
      hasNormalRecord: hasNormal
    })
  }
  
  return days
})

// 活跃学生姓名列表
const activeStudentNames = computed(() => 
  activeStudents.value.map(s => s.name)
)

// 选中学生姓名
const selectedStudentName = computed(() => {
  const student = students.value.find(s => s.id === recordForm.value.studentId)
  return student ? student.name : ''
})

// 当日课程记录
const todayRecords = computed(() => {
  const [year, month, day] = parseDate(selectedDate.value)
  return classData.value[year]?.[month]?.[day] || []
})

// 选中日期字符串
const selectedDateStr = computed(() => 
  dayjs(selectedDate.value).format('MM月DD日')
)

// 计算时长
const calculatedDuration = computed(() => {
  if (!recordForm.value.startTime || !recordForm.value.endTime) return 0
  return calculateTimeDiff(recordForm.value.startTime, recordForm.value.endTime)
})

// 获取某天的课程记录
const getRecordsOnDate = (dateStr: string) => {
  const [year, month, day] = parseDate(dateStr)
  return classData.value[year]?.[month]?.[day] || []
}

// 判断某天是否有课程
const hasRecordOnDate = (dateStr: string): boolean => {
  return getRecordsOnDate(dateStr).length > 0
}

// 选择日期
const selectDate = (day: CalendarDay) => {
  if (day.date) {
    selectedDate.value = day.dateStr
  }
}

// 上个月
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
}

// 下个月
const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
}

// 获取当天最后一条记录的结束时间
const getLastRecordEndTime = (): string | null => {
  const records = todayRecords.value
  if (records.length > 0) {
    const sorted = [...records].sort((a, b) => b.time[1].localeCompare(a.time[1]))
    return sorted[0].time[1]
  }
  return null
}

// 计算推荐的开始时间
const getRecommendedStartTime = (): string => {
  const lastEndTime = getLastRecordEndTime()
  
  if (lastEndTime) {
    const [hours, minutes] = lastEndTime.split(':').map(Number)
    const endTimeMinutes = hours * 60 + minutes
    
    // 午休时间段: 12:00 - 13:00
    const lunchStartMinutes = 12 * 60
    const lunchEndMinutes = 13 * 60
    
    if (endTimeMinutes >= lunchStartMinutes && endTimeMinutes < lunchEndMinutes) {
      return '13:00'
    }
    
    return lastEndTime
  } else {
    return '08:00'
  }
}

// 计算推荐的结束时间
const getRecommendedEndTime = (startTime: string): string => {
  if (!startTime) return ''
  
  const [hours, minutes] = startTime.split(':').map(Number)
  let endHours = hours + 2
  let endMinutes = minutes
  
  if (endHours >= 24) {
    endHours = 23
    endMinutes = 59
  }
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

// 显示添加弹窗
const showAddPopup = () => {
  isEdit.value = false
  editingRecordIndex.value = -1
  
  recordForm.value.date = selectedDate.value
  const recommendedStart = getRecommendedStartTime()
  recordForm.value.startTime = recommendedStart
  recordForm.value.endTime = getRecommendedEndTime(recommendedStart)
  
  showPopup.value = true
}

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false
  resetForm()
}

// 处理页面触摸移动（弹窗打开时阻止）
const handlePageTouchMove = (e: TouchEvent) => {
  if (showPopup.value) {
    e.preventDefault()
  }
}

// 重置表单
const resetForm = () => {
  recordForm.value = {
    studentId: null,
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '',
    endTime: '',
    isFuture: false
  }
}

// 学生选择
const onStudentChange = (e: any) => {
  const index = e.detail.value
  recordForm.value.studentId = activeStudents.value[index].id
}

// 日期选择
const onDateChange = (e: any) => {
  recordForm.value.date = e.detail.value
}

// 开始时间选择
const onStartTimeChange = (e: any) => {
  recordForm.value.startTime = e.detail.value
  recordForm.value.endTime = getRecommendedEndTime(e.detail.value)
}

// 结束时间选择
const onEndTimeChange = (e: any) => {
  recordForm.value.endTime = e.detail.value
}

// 未来课时开关
const onFutureChange = (e: any) => {
  recordForm.value.isFuture = e.detail.value
}

// 显示操作菜单
const showActionSheet = (record: TodayClass, index: number) => {
  currentRecord.value = record
  currentRecordIndex.value = index
  
  // 根据是否是未来课时显示不同选项
  const itemList = record.isFuture 
    ? ['已上课', '编辑', '删除'] 
    : ['编辑', '删除']
  
  uni.showActionSheet({
    itemList,
    itemColor: '#333',
    success: (res) => {
      if (record.isFuture) {
        // 未来课时的选项
        if (res.tapIndex === 0) {
          // 已上课
          markAsAttended(record, index)
        } else if (res.tapIndex === 1) {
          editRecord(record, index)
        } else if (res.tapIndex === 2) {
          deleteRecord(record, index)
        }
      } else {
        // 正常课时的选项
        if (res.tapIndex === 0) {
          editRecord(record, index)
        } else if (res.tapIndex === 1) {
          deleteRecord(record, index)
        }
      }
    }
  })
}

// 将未来课时标记为已上课
const markAsAttended = (record: TodayClass, index: number) => {
  const studentName = getStudentName(record.studentId)
  uni.showModal({
    title: '确认已上课',
    content: `确定将 ${studentName} 的未来课时标记为已上课吗？`,
    confirmColor: '#ff6b7a',
    success: (res) => {
      if (res.confirm) {
        store.markAsAttended(selectedDate.value, index)
        uni.showToast({ title: '已标记为已上课', icon: 'success' })
      }
    }
  })
}

// 编辑课程记录
const editRecord = (record: TodayClass, index: number) => {
  isEdit.value = true
  editingRecordIndex.value = index
  recordForm.value = {
    studentId: record.studentId,
    date: selectedDate.value,
    startTime: record.time[0],
    endTime: record.time[1],
    isFuture: record.isFuture || false
  }
  showPopup.value = true
}

// 提交课程记录
const submitRecord = () => {
  if (!recordForm.value.studentId) {
    uni.showToast({ title: '请选择学生', icon: 'none' })
    return
  }
  if (!recordForm.value.date) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return
  }
  if (!recordForm.value.startTime || !recordForm.value.endTime) {
    uni.showToast({ title: '请选择上课时间', icon: 'none' })
    return
  }
  
  if (calculatedDuration.value <= 0) {
    uni.showToast({ title: '结束时间必须大于开始时间', icon: 'none' })
    return
  }
  
  if (isEdit.value) {
    store.deleteClassRecord(recordForm.value.date, editingRecordIndex.value)
    store.createClassRecordAction(
      recordForm.value.date,
      recordForm.value.studentId,
      recordForm.value.startTime,
      recordForm.value.endTime,
      recordForm.value.isFuture
    )
    uni.showToast({ title: '修改成功', icon: 'success' })
  } else {
    store.createClassRecordAction(
      recordForm.value.date,
      recordForm.value.studentId,
      recordForm.value.startTime,
      recordForm.value.endTime,
      recordForm.value.isFuture
    )
    uni.showToast({ title: '添加成功', icon: 'success' })
  }
  
  closePopup()
}

// 获取学生姓名
const getStudentName = (studentId: number | null): string => {
  const student = students.value.find(s => s.id === studentId)
  return student ? student.name : '未知学生'
}

// 删除课程记录
const deleteRecord = (record: TodayClass, index: number) => {
  const studentName = getStudentName(record.studentId)
  const dateStr = dayjs(selectedDate.value).format('MM月DD日')
  const timeStr = `${record.time[0]}-${record.time[1]}`
  uni.showModal({
    title: '确认删除',
    content: `确定要删除 ${studentName} 的课程记录吗?\n日期：${dateStr}\n时间：${timeStr}`,
    confirmColor: '#ff6b7a',
    success: (res) => {
      if (res.confirm) {
        store.deleteClassRecord(selectedDate.value, index)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}
</script>

<style scoped>
.container {
  padding-bottom: 140rpx;
}

.container.no-scroll {
  overflow: hidden;
  height: 100vh;
}

/* 页面包装器 */
.page-wrapper {
  min-height: 100vh;
}

.page-wrapper.no-scroll {
  overflow: hidden;
  height: 100vh;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
}

.calendar-card {
  overflow: hidden;
  transition: none;
}

.calendar-card:active {
  transform: none;
}

.calendar-header {
  margin-bottom: 24rpx;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
}

.nav-btn {
  font-size: 48rpx;
  color: #ff7b8a;
  padding: 0 16rpx;
  font-weight: 300;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.nav-btn:active {
  transform: scale(0.8);
  opacity: 0.7;
}

.month-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  min-width: 200rpx;
  text-align: center;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #fce7f3;
}

.weekday {
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
  font-weight: 500;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.day-item {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.day-item:active {
  transform: scale(0.85);
  opacity: 0.8;
}

.day-item.empty {
  visibility: hidden;
}

.day-number {
  font-size: 28rpx;
  color: #6b7280;
  font-weight: 500;
}

.day-item.today .day-number {
  color: #ff7b8a;
  font-weight: 600;
}

.day-item.selected {
  background: linear-gradient(135deg, #ff7b8a 0%, #ff9aa2 100%);
  box-shadow: 0 4rpx 12rpx rgba(255, 123, 138, 0.3);
}

.day-item.selected .day-number {
  color: #fff;
  font-weight: 600;
}

.day-item.has-record:not(.selected) .day-number {
  color: #ff6b7a;
  font-weight: 600;
}

.day-dots {
  position: absolute;
  bottom: 8rpx;
  display: flex;
  gap: 6rpx;
  justify-content: center;
  left: 50%;
  transform: translateX(-50%);
}

.day-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}

.day-dot.normal {
  background: linear-gradient(135deg, #ff7b8a 0%, #ff9aa2 100%);
}

.day-dot.future {
  background: #9ca3af;
}

.day-item.selected .day-dot.normal {
  background: #fff;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0 16rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
}

.title-count {
  font-size: 26rpx;
  color: #ff7b8a;
  font-weight: 500;
}

.record-list {
  margin-bottom: 24rpx;
}

.record-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 182, 193, 0.12);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-item:active {
  transform: scale(0.98);
}

.record-left {
  flex: 1;
}

.record-time {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.time-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}

.time-text {
  font-size: 28rpx;
  color: #6b7280;
  font-weight: 500;
}

.student-name {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 30rpx;
  color: #1f2937;
  font-weight: 600;
}

.name-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}

.record-right {
  flex-shrink: 0;
  margin-left: 20rpx;
}

.duration-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
  background: linear-gradient(135deg, #ff7b8a 0%, #ff9aa2 100%);
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-weight: 500;
}

/* 未来课时样式 */
.future-record {
  opacity: 0.6;
}

.future-tag {
  font-size: 22rpx;
  color: #9ca3af;
  background: #e5e7eb;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  margin-left: 8rpx;
}

.duration-preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #ffeef0 0%, #ffe4e9 100%);
  border-radius: 16rpx;
  margin-bottom: 28rpx;
}

/* 时间选择同一行 */
.time-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.time-picker-wrapper {
  flex: 1;
}

.time-picker-wrapper picker {
  width: 100%;
}

.time-picker {
  width: 100%;
  box-sizing: border-box;
}

.time-separator {
  font-size: 32rpx;
  color: #9ca3af;
  font-weight: 300;
  flex-shrink: 0;
}

.preview-label {
  font-size: 28rpx;
  color: #6b7280;
}

.preview-value {
  font-size: 32rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #ff7b8a, #ff6b7a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 未来课时开关 */
.future-switch {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-left: auto;
}

.future-label {
  font-size: 24rpx;
  color: #9ca3af;
}
</style>
