<template>
  <view class="page-wrapper" :class="{ 'no-scroll': showPopup }">
    <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar" v-if="sortedStudents.length > 0">
      <view class="search-input-wrapper">
        <image class="search-icon" src="/static/icon/search.png" mode="aspectFit" />
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索学生姓名"
          placeholder-class="input-placeholder"
        />
        <text class="clear-icon" v-if="searchKeyword" @click="clearSearch">×</text>
      </view>
    </view>

    <!-- 学生列表 -->
    <view v-if="filteredStudents.length > 0" class="student-list">
      <!-- 启用的学生 -->
      <view
        class="student-item fade-in"
        v-for="student in activeStudents"
        :key="student.id"
        @longpress="showActionSheet(student)"
      >
        <view class="student-card">
          <view class="student-avatar">
            <text class="avatar-text">{{ student.name.charAt(0) }}</text>
          </view>
          <view class="student-info">
            <text class="student-name">{{ student.name }}</text>
            <text class="student-date">{{ formatDateDisplay(student.createTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 禁用的学生（默认折叠，点击展开） -->
      <view v-if="disabledStudents.length > 0" class="disabled-section">
        <view class="disabled-header" @click="showDisabled = !showDisabled">
          <view class="disabled-header-left">
            <text class="disabled-dot">·</text>
            <text class="disabled-title">已禁用学生</text>
            <text class="disabled-badge">{{ disabledStudents.length }}</text>
          </view>
          <text class="disabled-arrow" :class="{ expanded: disabledExpanded }">›</text>
        </view>
        <view v-if="disabledExpanded" class="disabled-grid">
          <view
            class="student-item fade-in"
            v-for="student in disabledStudents"
            :key="student.id"
            @longpress="showActionSheet(student)"
          >
            <view class="student-card disabled">
              <view class="student-avatar">
                <text class="avatar-text">{{ student.name.charAt(0) }}</text>
              </view>
              <view class="student-info">
                <text class="student-name">{{ student.name }}</text>
                <text class="student-date">{{ formatDateDisplay(student.createTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索无结果 -->
    <view v-else-if="sortedStudents.length > 0 && filteredStudents.length === 0" class="empty-state fade-in">
      <text class="empty-text">未找到"{{ searchKeyword }}"相关学生</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="sortedStudents.length === 0" class="empty-state fade-in">
      <text class="empty-text">还没有添加学生哦~</text>
    </view>

    <!-- 可拖动浮动按钮 -->
    <drag-float-btn @click="showAddPopup" />

    <!-- 添加/编辑学生弹窗 -->
    <popup-modal
      :visible="showPopup"
      :title="isEdit ? '编辑学生' : '添加学生'"
      :submitText="isEdit ? '保存修改' : '确认添加'"
      @close="closePopup"
      @submit="submitStudent"
    >
      <!-- 学生姓名 -->
      <view class="form-item">
        <text class="form-label">学生姓名</text>
        <input 
          class="input-field"
          v-model="studentForm.name"
          placeholder="请输入学生姓名"
          placeholder-class="input-placeholder"
          maxlength="20"
        />
      </view>

      <!-- 是否启用 -->
      <view class="form-item">
        <text class="form-label">是否启用</text>
        <view class="switch-wrapper">
          <switch
            :checked="!studentForm.disabled"
            @change="onSwitchChange"
            color="#ff7b8a"
          />
          <text class="switch-text">{{ studentForm.disabled ? '已禁用' : '已启用' }}</text>
        </view>
      </view>

      <!-- 学生统计（仅编辑时显示） -->
      <view class="form-item" v-if="isEdit">
        <text class="form-label">课时统计</text>
        <view class="stats-info">
          <view class="stats-row">
            <text class="stats-label">累计课时</text>
            <text class="stats-value">{{ editingStudentHours }} 课时</text>
          </view>
          <view class="stats-row">
            <text class="stats-label">累计课节</text>
            <text class="stats-value">{{ editingStudentRecordCount }} 节</text>
          </view>
        </view>
      </view>
    </popup-modal>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DragFloatBtn from '@/components/drag-float-btn.vue'
import PopupModal from '@/components/popup-modal.vue'
import { useAppStore } from '@/store'
import { storeToRefs } from 'pinia'
import type { Student } from '@/types'
import { formatDateDisplay } from '@/utils/common'

const store = useAppStore()
const { sortedStudents } = storeToRefs(store)

// 弹窗相关
const showPopup = ref(false)
const isEdit = ref(false)
const editingStudentId = ref<number | null>(null)
const currentStudent = ref<Student | null>(null)

// 编辑学生的课时统计（仅遍历一次 classData，课时与课节数共用）
const editingStudentStats = computed(() => {
  if (!isEdit.value || editingStudentId.value === null) {
    return { records: [], totalMinutes: 0 }
  }
  return store.getStudentStats(editingStudentId.value)
})

const editingStudentHours = computed(() =>
  (editingStudentStats.value.totalMinutes / 60).toFixed(1)
)

const editingStudentRecordCount = computed(() =>
  editingStudentStats.value.records.length
)

// 搜索关键词
const searchKeyword = ref('')

// 过滤后的学生列表（基于已排序的列表）
const filteredStudents = computed(() => {
  if (!searchKeyword.value.trim()) {
    return sortedStudents.value
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  return sortedStudents.value.filter(student => 
    student.name.toLowerCase().includes(keyword)
  )
})

// 启用的学生
const activeStudents = computed(() => {
  return filteredStudents.value.filter(student => !student.disabled)
})

// 禁用的学生
const disabledStudents = computed(() => {
  return filteredStudents.value.filter(student => student.disabled)
})

// 禁用学生默认折叠；搜索时自动展开以便看到匹配结果
const showDisabled = ref(false)
const disabledExpanded = computed(() => showDisabled.value || !!searchKeyword.value.trim())

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
}

// 表单数据
const studentForm = ref({
  name: '',
  disabled: false
})

// 显示添加弹窗
const showAddPopup = () => {
  isEdit.value = false
  editingStudentId.value = null
  studentForm.value = {
    name: '',
    disabled: false
  }
  showPopup.value = true
}

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false
  studentForm.value = {
    name: '',
    disabled: false
  }
}

// 显示操作菜单
const showActionSheet = (student: Student) => {
  currentStudent.value = student
  const toggleText = student.disabled ? '启用' : '禁用'
  uni.showActionSheet({
    itemList: [toggleText, '编辑', '删除'],
    itemColor: '#333',
    success: (res) => {
      if (res.tapIndex === 0) {
        toggleStudentStatus(student)
      } else if (res.tapIndex === 1) {
        editStudent(student)
      } else if (res.tapIndex === 2) {
        deleteStudent(student)
      }
    }
  })
}

// 切换学生启用/禁用状态
const toggleStudentStatus = (student: Student) => {
  const action = student.disabled ? '启用' : '禁用'
  uni.showModal({
    title: `确认${action}`,
    content: `确定要${action}学生"${student.name}"吗?`,
    confirmColor: '#ff6b7a',
    success: (res) => {
      if (res.confirm) {
        store.toggleStudentDisabled(student.id)
        uni.showToast({ title: `已${action}`, icon: 'success' })
      }
    }
  })
}

// 编辑学生
const editStudent = (student: Student) => {
  isEdit.value = true
  editingStudentId.value = student.id
  studentForm.value = {
    name: student.name,
    disabled: student.disabled
  }
  showPopup.value = true
}

// 提交学生信息
const submitStudent = () => {
  if (!studentForm.value.name.trim()) {
    uni.showToast({ title: '请输入学生姓名', icon: 'none' })
    return
  }
  
  if (isEdit.value && editingStudentId.value !== null) {
    store.updateStudent(editingStudentId.value, {
      name: studentForm.value.name.trim(),
      disabled: studentForm.value.disabled
    })
    uni.showToast({ title: '修改成功', icon: 'success' })
  } else {
    store.createNewStudent(studentForm.value.name.trim())
    uni.showToast({ title: '添加成功', icon: 'success' })
  }
  
  closePopup()
}

// 开关切换
const onSwitchChange = (e: any) => {
  studentForm.value.disabled = !e.detail.value
}

// 删除学生
const deleteStudent = (student: Student) => {
  const recordCount = store.getStudentRecords(student.id).length
  uni.showModal({
    title: '确认删除',
    content: `确定要删除学生"${student.name}"吗?${recordCount > 0 ? `\n该学生有 ${recordCount} 条课程记录,删除后无法恢复。` : ''}`,
    confirmColor: '#ff6b7a',
    success: (res) => {
      if (res.confirm) {
        store.deleteStudent(student.id)
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

/* 搜索栏 */
.search-bar {
  margin-bottom: 24rpx;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 24rpx;
  padding: 20rpx 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 182, 193, 0.12);
  gap: 16rpx;
}

.search-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1f2937;
  height: 40rpx;
  line-height: 40rpx;
}

.clear-icon {
  font-size: 36rpx;
  color: #9ca3af;
  padding: 0 8rpx;
  flex-shrink: 0;
}

.student-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.student-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(255, 182, 193, 0.1);
  display: flex;
  align-items: center;
  gap: 16rpx;
  transition: all 0.3s ease;
}

.student-item:active .student-card {
  transform: scale(0.96);
  box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08);
}

.student-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff7b8a 0%, #ff9aa2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}

.student-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.student-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-date {
  font-size: 22rpx;
  color: #9ca3af;
}

/* 禁用学生区域 */
.disabled-section {
  grid-column: span 2;
  margin-top: 28rpx;
}

.disabled-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 18rpx;
  padding: 22rpx 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 182, 193, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.disabled-header:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08);
}

.disabled-header-left {
  display: flex;
  align-items: center;
}

/* 与统计页老师姓名后的“·”大小、间距保持一致（颜色仍为灰色） */
.disabled-dot {
  font-size: 28rpx;
  color: #d1d5db;
  line-height: 1;
  margin-right: 8rpx;
}

.disabled-title {
  font-size: 27rpx;
  color: #6b7280;
  font-weight: 600;
}

.disabled-badge {
  min-width: 32rpx;
  text-align: center;
  font-size: 20rpx;
  color: #ff6b7a;
  background: #ffeef0;
  border-radius: 20rpx;
  padding: 2rpx 14rpx;
  font-weight: 600;
  margin-left: 12rpx;
}

.disabled-arrow {
  font-size: 34rpx;
  color: #d1d5db;
  font-weight: 300;
  transition: transform 0.25s ease, color 0.25s ease;
}

.disabled-arrow.expanded {
  transform: rotate(90deg);
  color: #ff9aa2;
}

.disabled-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-top: 18rpx;
}

.student-card.disabled {
  opacity: 0.6;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fef1f2;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.switch-wrapper:active {
  transform: scale(0.98);
  opacity: 0.85;
}

.switch-text {
  font-size: 30rpx;
  color: #1f2937;
}

/* 统计信息样式 */
.stats-info {
  background: #fef1f2;
  border-radius: 16rpx;
  padding: 20rpx 28rpx;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}

.stats-row:not(:last-child) {
  border-bottom: 1rpx solid rgba(255, 123, 138, 0.15);
}

.stats-label {
  font-size: 28rpx;
  color: #6b7280;
}

.stats-value {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff7b8a;
}
</style>
