/**
 * Pinia Store - 数据状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Student, TodayClass, ClassData, StorageData } from '@/types'
import {
  createStudent as createStudentObj,
  createTodayClass,
  parseDate,
  minutesToHours
} from '@/utils/common'
import { uploadToWebDAV, downloadFromWebDAV, isWebDAVConfigured } from '@/utils/webdav'
import { debounce } from '@/utils/common'

// 防抖同步延迟时间（毫秒）
const SYNC_DEBOUNCE_DELAY = 3000

// 数据存储键名
const STORAGE_KEYS = {
  STUDENTS: 'class_record_students',
  CLASS: 'class_record_class'
} as const

export const useAppStore = defineStore('app', () => {
  // State
  const students = ref<Student[]>([])
  const classData = ref<ClassData>({})

  // Getters
  // 排序规则：启用的学生在前，最近添加的学生在前
  const sortedStudents = computed(() => {
    return [...students.value].sort((a, b) => {
      // 1. 启用的学生排在前面
      if (a.disabled !== b.disabled) {
        return a.disabled ? 1 : -1
      }
      // 2. 最近添加的学生排在前面（倒序）
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.id
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.id
      return timeB - timeA // 倒序：最新数据在前
    })
  })

  // 启用状态的学生列表（已排序）
  const activeStudents = computed(() => sortedStudents.value.filter(s => !s.disabled))

  // 总课程记录数
  const totalRecords = computed(() => {
    let count = 0
    Object.values(classData.value).forEach(yearData => {
      Object.values(yearData).forEach(monthData => {
        Object.values(monthData).forEach(dayRecords => {
          count += dayRecords.length
        })
      })
    })
    return count
  })

  const nextStudentId = computed(() => {
    if (students.value.length === 0) return 1
    return students.value.reduce((max, s) => Math.max(max, s.id), 0) + 1
  })

  // Actions
  function initData(): void {
    try {
      const storedStudents = uni.getStorageSync(STORAGE_KEYS.STUDENTS)
      const storedClassData = uni.getStorageSync(STORAGE_KEYS.CLASS)

      students.value = storedStudents || []
      classData.value = storedClassData || {}

      console.log('数据初始化完成', {
        studentCount: students.value.length,
        hasClassData: Object.keys(classData.value).length > 0
      })
    } catch (e) {
      console.error('数据初始化失败', e)
      students.value = []
      classData.value = {}
    }
  }

  function addStudent(student: Student): void {
    students.value.push(student)
    uni.setStorageSync(STORAGE_KEYS.STUDENTS, students.value)
    triggerSync()
  }

  function updateStudent(id: number, updates: Partial<Student>): void {
    const index = students.value.findIndex(s => s.id === id)
    if (index !== -1) {
      students.value[index] = { ...students.value[index], ...updates }
      uni.setStorageSync(STORAGE_KEYS.STUDENTS, students.value)
      triggerSync()
    }
  }

  function deleteStudent(id: number): void {
    const index = students.value.findIndex(s => s.id === id)
    if (index !== -1) {
      students.value.splice(index, 1)
      uni.setStorageSync(STORAGE_KEYS.STUDENTS, students.value)
      triggerSync()
    }
  }

  function toggleStudentDisabled(id: number): void {
    const student = students.value.find(s => s.id === id)
    if (student) {
      student.disabled = !student.disabled
      uni.setStorageSync(STORAGE_KEYS.STUDENTS, students.value)
      triggerSync()
    }
  }

  function addClassRecord(date: string, classItem: TodayClass): void {
    const [year, month, day] = parseDate(date)
    
    // 初始化嵌套结构
    if (!classData.value[year]) {
      classData.value[year] = {}
    }
    if (!classData.value[year][month]) {
      classData.value[year][month] = {}
    }
    if (!classData.value[year][month][day]) {
      classData.value[year][month][day] = []
    }
    
    // 添加课程记录
    classData.value[year][month][day].push(classItem)
    
    // 按开始时间排序（比较完整的 "HH:MM"，字典序即为时间先后）
    classData.value[year][month][day].sort((a, b) => {
      const timeA = a.time[0] || ''
      const timeB = b.time[0] || ''
      return timeA.localeCompare(timeB)
    })
    
    // 保存到存储
    uni.setStorageSync(STORAGE_KEYS.CLASS, classData.value)
    triggerSync()
  }

  function deleteClassRecord(date: string, index: number): void {
    const [year, month, day] = parseDate(date)
    
    if (classData.value[year]?.[month]?.[day]) {
      classData.value[year][month][day].splice(index, 1)
      
      // 如果当天没有记录了，删除空对象
      if (classData.value[year][month][day].length === 0) {
        delete classData.value[year][month][day]
        if (Object.keys(classData.value[year][month]).length === 0) {
          delete classData.value[year][month]
          if (Object.keys(classData.value[year]).length === 0) {
            delete classData.value[year]
          }
        }
      }
      
      uni.setStorageSync(STORAGE_KEYS.CLASS, classData.value)
      triggerSync()
    }
  }

  function clearAllData(): void {
    students.value = []
    classData.value = {}
    uni.removeStorageSync(STORAGE_KEYS.STUDENTS)
    uni.removeStorageSync(STORAGE_KEYS.CLASS)
  }

  function restoreData(data: StorageData): void {
    if (data.students && Array.isArray(data.students)) {
      students.value = data.students
      uni.setStorageSync(STORAGE_KEYS.STUDENTS, data.students)
    }
    const classDataValue = data.classData || (data as any).class
    if (classDataValue && typeof classDataValue === 'object') {
      classData.value = classDataValue
      uni.setStorageSync(STORAGE_KEYS.CLASS, classDataValue)
    }
  }

  function getClassByDate(date: string): TodayClass[] {
    const [year, month, day] = parseDate(date)
    return classData.value[year]?.[month]?.[day] || []
  }

  function getClassByMonth(year: number, month: number): TodayClass[] {
    if (classData.value[year]?.[month]) {
      const days = classData.value[year][month]
      return Object.values(days).flat(Infinity) as TodayClass[]
    }
    return []
  }

  // 获取学生统计数据（记录列表和总课时），合并遍历优化性能
  function getStudentStats(studentId: number): { records: TodayClass[], totalMinutes: number } {
    const records: TodayClass[] = []
    let totalMinutes = 0
    Object.values(classData.value).forEach(yearData => {
      Object.values(yearData).forEach(monthData => {
        Object.values(monthData).forEach(dayRecords => {
          dayRecords.forEach(record => {
            // 排除未来课时
            if (record.studentId === studentId && !record.isFuture) {
              records.push(record)
              totalMinutes += record.timeDiff || 0
            }
          })
        })
      })
    })
    return { records, totalMinutes }
  }

  function getStudentRecords(studentId: number): TodayClass[] {
    return getStudentStats(studentId).records
  }

  function getStudentHours(studentId: number): number {
    return minutesToHours(getStudentStats(studentId).totalMinutes)
  }

  async function createNewStudent(name: string): Promise<Student> {
    const student = createStudentObj(nextStudentId.value, name)
    addStudent(student)
    return student
  }

  async function createClassRecordAction(
    date: string, 
    studentId: number | null, 
    startTime: string, 
    endTime: string,
    isFuture: boolean = false
  ): Promise<TodayClass> {
    const classItem = createTodayClass(studentId, startTime, endTime, isFuture)
    addClassRecord(date, classItem)
    return classItem
  }

  // 将未来课时转为正常课时
  function markAsAttended(date: string, index: number): void {
    const [year, month, day] = parseDate(date)
    const records = classData.value[year]?.[month]?.[day]
    if (records && records[index]) {
      records[index].isFuture = false
      uni.setStorageSync(STORAGE_KEYS.CLASS, classData.value)
      triggerSync()
    }
  }

  async function syncToWebDAV(): Promise<boolean> {
    if (!isWebDAVConfigured()) {
      console.log('WebDAV 未配置，跳过同步')
      return false
    }

    const data: StorageData = {
      students: students.value,
      classData: classData.value,
      syncTime: new Date().toISOString()
    }

    return await uploadToWebDAV(data)
  }

  async function syncFromWebDAV(): Promise<boolean> {
    if (!isWebDAVConfigured()) {
      console.log('WebDAV 未配置，跳过恢复')
      return false
    }

    const data = await downloadFromWebDAV()
    if (data) {
      restoreData(data)
      return true
    }
    return false
  }

  // 防抖同步（数据变更后 3 秒内无新操作才执行）
  const debouncedSync = debounce(async () => {
    const success = await syncToWebDAV()
    if (success) {
      console.log('数据变更后自动同步成功')
    }
  }, SYNC_DEBOUNCE_DELAY)

  // 触发数据变更同步
  function triggerSync(): void {
    debouncedSync()
  }

  // 初始化数据
  initData()

  return {
    // State
    students,
    classData,
    // Getters
    sortedStudents,
    activeStudents,
    totalRecords,
    nextStudentId,
    // Actions
    initData,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentDisabled,
    addClassRecord,
    deleteClassRecord,
    clearAllData,
    restoreData,
    getClassByDate,
    getClassByMonth,
    getStudentStats,
    getStudentRecords,
    getStudentHours,
    createNewStudent,
    createClassRecordAction,
    markAsAttended,
    syncToWebDAV,
    syncFromWebDAV,
    triggerSync
  }
})
