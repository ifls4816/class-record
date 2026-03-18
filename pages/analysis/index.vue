<template>
  <view class="page-wrapper" :class="{ 'no-scroll': showDetailPopup }" @touchmove="handlePageTouchMove">
    <view class="container">
    <!-- 时间导航与总课时 -->
    <view class="header-card fade-in">
      <view class="header-top">
        <view class="nav-btn" @click="prevPeriod">
          <text class="nav-arrow">‹</text>
        </view>
        <view class="current-period" @click="toggleViewMode">
          <text class="period-text">{{ displayText }}</text>
        </view>
        <view class="nav-btn" @click="nextPeriod">
          <text class="nav-arrow">›</text>
        </view>
      </view>
      <view class="header-divider"></view>
      <view class="header-bottom">
        <text class="total-label">总课时</text>
        <view class="total-value-wrap">
          <text class="total-value">{{ totalHours }}</text>
          <text class="total-unit">小时</text>
        </view>
      </view>
    </view>

    <!-- 课时统计 -->
    <view class="ranking-section">
      <view v-if="groupedRankingList.length > 0">
        <view v-for="group in groupedRankingList" :key="group.teacherName" class="teacher-group">
          <view class="group-title">
            <text class="teacher-name">{{ group.teacherName }}</text>
            <text class="teacher-hours"> · {{ group.totalHours }}小时</text>
          </view>
          <view class="ranking-list">
            <view class="ranking-item fade-in" v-for="item in group.students" :key="item.studentId" @click="showStudentDetail(item)">
              <view class="rank-info">
                <text class="rank-name">{{ item.studentName }}</text>
                <text class="rank-time">{{ item.totalHours }}小时</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state fade-in">
        <text class="empty-text">暂无数据统计</text>
      </view>
    </view>

    <!-- 学生详情弹窗 -->
    <popup-modal
      :visible="showDetailPopup"
      :title="selectedStudent?.studentName || ''"
      :submitText="''"
      @close="closeDetailPopup"
      @submit="closeDetailPopup"
    >
      <view class="detail-header">
        <text class="detail-subtitle">共 {{ selectedStudent?.totalHours }} 小时</text>
      </view>
      <view v-if="studentDetailList.length > 0" class="detail-list">
        <view class="detail-item" v-for="(record, index) in studentDetailList" :key="record.date + record.startTime">
          <text class="detail-date">{{ record.displayDate }}</text>
          <text class="detail-time">{{ record.startTime }}-{{ record.endTime }}</text>
          <text class="detail-hours">{{ record.hours }}小时</text>
        </view>
      </view>
      <view v-else class="empty-detail">
        <text class="empty-text">暂无课时记录</text>
      </view>
    </popup-modal>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import PopupModal from '@/components/popup-modal.vue'
import { useAppStore } from '@/store'
import { storeToRefs } from 'pinia'
import type { TodayClass } from '@/types'

const store = useAppStore()
const { students, classData } = storeToRefs(store)

// 视图模式：月/年
const viewMode = ref<'month' | 'year'>('month')

// 当前选中的年月
const selectedYear = ref(dayjs().year())
const selectedMonth = ref(dayjs().month() + 1)

// 显示的文本
const displayText = computed(() => {
  if (viewMode.value === 'month') {
    return `${selectedYear.value}年${selectedMonth.value}月`
  } else {
    return `${selectedYear.value}年`
  }
})

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'month' ? 'year' : 'month'
}

// 上一个时间段
const prevPeriod = () => {
  if (viewMode.value === 'month') {
    const current = dayjs(`${selectedYear.value}-${selectedMonth.value}-01`)
    const prev = current.subtract(1, 'month')
    selectedYear.value = prev.year()
    selectedMonth.value = prev.month() + 1
  } else {
    selectedYear.value -= 1
  }
}

// 下一个时间段
const nextPeriod = () => {
  if (viewMode.value === 'month') {
    const current = dayjs(`${selectedYear.value}-${selectedMonth.value}-01`)
    const next = current.add(1, 'month')
    selectedYear.value = next.year()
    selectedMonth.value = next.month() + 1
  } else {
    selectedYear.value += 1
  }
}

// 时间范围
const timeRange = computed(() => {
  if (viewMode.value === 'month') {
    const current = dayjs(`${selectedYear.value}-${selectedMonth.value}-01`)
    return {
      year: selectedYear.value,
      month: selectedMonth.value,
      start: current.startOf('month').format('YYYY-MM-DD'),
      end: current.endOf('month').format('YYYY-MM-DD')
    }
  } else {
    const current = dayjs(`${selectedYear.value}-01-01`)
    return {
      year: selectedYear.value,
      month: null as number | null,
      start: current.startOf('year').format('YYYY-MM-DD'),
      end: current.endOf('year').format('YYYY-MM-DD')
    }
  }
})

// 获取时间范围内的所有课程记录
interface RecordWithDate extends TodayClass {
  date: string
}

const filteredRecords = computed<RecordWithDate[]>(() => {
  const records: RecordWithDate[] = []
  const { year, month } = timeRange.value

  if (month) {
    const monthData = classData.value[year]?.[month]
    if (monthData) {
      Object.entries(monthData).forEach(([day, dayRecords]) => {
        dayRecords.forEach(record => {
          // 过滤掉未来课时
          if (record.isFuture) return
          records.push({
            ...record,
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          })
        })
      })
    }
  } else {
    const yearData = classData.value[year]
    if (yearData) {
      Object.entries(yearData).forEach(([month, monthData]) => {
        Object.entries(monthData).forEach(([day, dayRecords]) => {
          dayRecords.forEach(record => {
            // 过滤掉未来课时
            if (record.isFuture) return
            records.push({
              ...record,
              date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            })
          })
        })
      })
    }
  }

  return records
})

// 总课时(分钟)
const totalMinutes = computed(() => 
  filteredRecords.value.reduce((sum, r) => sum + (r.timeDiff || 0), 0)
)

// 总课时(小时)
const totalHours = computed(() => 
  (totalMinutes.value / 60).toFixed(1)
)

// 排行榜
interface RankingItem {
  studentId: number | null
  studentName: string
  teacherName: string
  totalMinutes: number
  recordCount: number
  totalHours: string
}

// 分组后的排行榜
interface TeacherGroup {
  teacherName: string
  students: RankingItem[]
  totalMinutes: number
  totalHours: string
}

const groupedRankingList = computed<TeacherGroup[]>(() => {
  const studentStats: Record<number, RankingItem> = {}
  
  filteredRecords.value.forEach(record => {
    if (!record.studentId) return
    
    if (!studentStats[record.studentId]) {
      const student = students.value.find(s => s.id === record.studentId)
      // 解析学生名称，提取老师名称（格式：学生名-老师名）
      const nameParts = student ? student.name.split('-') : ['未知学生']
      const studentName = nameParts[0].trim()
      const teacherName = nameParts.length > 1 ? nameParts[1].trim() : '未分类'
      
      studentStats[record.studentId] = {
        studentId: record.studentId,
        studentName,
        teacherName,
        totalMinutes: 0,
        recordCount: 0,
        totalHours: '0.0'
      }
    }
    studentStats[record.studentId].totalMinutes += record.timeDiff || 0
    studentStats[record.studentId].recordCount += 1
  })
  
  // 计算课时并排序
  const sortedList = Object.values(studentStats)
    .map(stat => ({
      ...stat,
      totalHours: (stat.totalMinutes / 60).toFixed(1)
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
  
  // 按老师分组
  const groups: Record<string, RankingItem[]> = {}
  sortedList.forEach(item => {
    if (!groups[item.teacherName]) {
      groups[item.teacherName] = []
    }
    groups[item.teacherName].push(item)
  })
  
  // 转换为数组并计算每个老师的累计课时
  return Object.entries(groups)
    .map(([teacherName, students]) => {
      const totalMinutes = students.reduce((sum, s) => sum + s.totalMinutes, 0)
      return {
        teacherName,
        students,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(1)
      }
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
})

// 学生详情弹窗
const showDetailPopup = ref(false)
const selectedStudent = ref<RankingItem | null>(null)

interface StudentDetailRecord {
  date: string
  displayDate: string
  startTime: string
  endTime: string
  timeDiff: number
  hours: string
}

const studentDetailList = computed<StudentDetailRecord[]>(() => {
  if (!selectedStudent.value) return []

  const records: StudentDetailRecord[] = []
  const studentId = selectedStudent.value.studentId

  filteredRecords.value.forEach(record => {
    if (record.studentId !== studentId) return
    if (!record.date) return

    // 从 time 数组中获取开始和结束时间
    const [startTime, endTime] = record.time || []

    records.push({
      date: record.date,
      displayDate: dayjs(record.date).format('M月D日'),
      startTime: startTime || '',
      endTime: endTime || '',
      timeDiff: record.timeDiff || 0,
      hours: ((record.timeDiff || 0) / 60).toFixed(1)
    })
  })

  // 按日期降序排序
  return records.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})

// 显示学生详情
const showStudentDetail = (item: RankingItem) => {
  selectedStudent.value = item
  showDetailPopup.value = true
}

// 关闭学生详情弹窗
const closeDetailPopup = () => {
  showDetailPopup.value = false
}

// 处理页面触摸移动（弹窗打开时阻止）
const handlePageTouchMove = (e: TouchEvent) => {
  if (showDetailPopup.value) {
    e.preventDefault()
  }
}
</script>

<style scoped>
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
.container {
  padding-bottom: 40rpx;
}

/* 头部卡片 */
.header-card {
  background: linear-gradient(135deg, #ff7b8a 0%, #ff9aa2 100%);
  border-radius: 20rpx;
  padding: 20rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 123, 138, 0.35);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.nav-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

.nav-btn:active {
  transform: scale(0.85);
  background: rgba(255, 255, 255, 0.4);
  opacity: 0.9;
}

.nav-arrow {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
  line-height: 1;
}

.current-period {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease;
}

.current-period:active {
  opacity: 0.7;
}

.period-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

.header-divider {
  height: 1rpx;
  background: rgba(255, 255, 255, 0.3);
  margin: 16rpx 0;
}

.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.total-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}

.total-value {
  font-size: 40rpx;
  color: #fff;
  font-weight: 700;
  line-height: 1;
}

.total-unit {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.ranking-section {
  margin-top: 16rpx;
}

.teacher-group {
  margin-bottom: 32rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
}

.teacher-name {
  color: #1f2937;
}

.teacher-hours {
  color: #ff6b7a;
}

.ranking-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.ranking-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 182, 193, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.ranking-item:active {
  transform: scale(0.92);
  box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08);
  opacity: 0.85;
}

.rank-info {
  text-align: center;
}

.rank-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-time {
  font-size: 24rpx;
  color: #ff6b7a;
  font-weight: 600;
}

.empty-state {
  padding: 80rpx 40rpx;
}

/* 学生详情弹窗 */
.detail-header {
  margin-bottom: 20rpx;
}

.detail-subtitle {
  font-size: 28rpx;
  color: #ff6b7a;
  font-weight: 500;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.detail-item {
  background: linear-gradient(135deg, #fef1f2 0%, #fff5f6 100%);
  border-radius: 16rpx;
  padding: 16rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  border-left: 4rpx solid #ff6b7a;
}

.detail-date {
  font-size: 24rpx;
  font-weight: 600;
  color: #1f2937;
}

.detail-time {
  font-size: 20rpx;
  color: #9ca3af;
}

.detail-hours {
  font-size: 22rpx;
  color: #ff6b7a;
  font-weight: 600;
}

.empty-detail {
  padding: 80rpx 0;
  text-align: center;
}

.empty-detail .empty-text {
  color: #9ca3af;
  font-size: 28rpx;
}
</style>
