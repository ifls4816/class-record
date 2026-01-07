/**
 * 统一数据管理层
 * 所有组件通过此模块访问数据，避免重复读取数据库
 */
import { reactive, toRaw } from 'vue'
import { db } from '../server/db/initDB'
import { Student, TodayClass } from '../types/type'

interface DataStore {
  student: Student[]
  class: Record<string, any>
  initialized: boolean
}

// 响应式数据存储
const store = reactive<DataStore>({
  student: [],
  class: {},
  initialized: false
})

// 初始化数据（应用启动时调用一次）
export const initDataStore = () => {
  if (store.initialized) return
  store.student = db.get('student') || []
  store.class = db.get('class') || {}
  store.initialized = true
}

// 获取学生列表（直接返回缓存）
export const getStudentList = (): Student[] => {
  if (!store.initialized) initDataStore()
  return store.student
}

// 获取课程数据（直接返回缓存）
export const getClassData = (): Record<string, any> => {
  if (!store.initialized) initDataStore()
  return store.class
}

// 获取未禁用的学生列表
export const getActiveStudentList = (): Student[] => {
  return getStudentList().filter(s => !s.disabled)
}

// 根据ID查询学生（O(1)查询）
const studentMap = new Map<number, Student>()
export const getStudentById = (id: number): Student | undefined => {
  if (studentMap.size === 0) {
    getStudentList().forEach(s => studentMap.set(s.id, s))
  }
  return studentMap.get(id)
}

// 更新学生列表并同步到数据库
export const setStudentList = (list: Student[]) => {
  store.student = list
  studentMap.clear()
  list.forEach(s => studentMap.set(s.id, s))
  db.set('student', toRaw(list))
}

// 添加学生
export const addStudent = (student: Student) => {
  store.student.push(student)
  studentMap.set(student.id, student)
  db.set('student', toRaw(store.student))
}

// 更新学生
export const updateStudent = (student: Student) => {
  const idx = store.student.findIndex(s => s.id === student.id)
  if (idx !== -1) {
    store.student[idx] = student
    studentMap.set(student.id, student)
    db.set('student', toRaw(store.student))
  }
}

// 删除学生
export const deleteStudent = (id: number) => {
  const idx = store.student.findIndex(s => s.id === id)
  if (idx !== -1) {
    store.student.splice(idx, 1)
    studentMap.delete(id)
    db.set('student', toRaw(store.student))
  }
}

// 更新课程数据并同步到数据库
export const setClassData = (data: Record<string, any>) => {
  store.class = data
  db.set('class', toRaw(data))
}

// 重新加载所有数据（用于数据恢复场景）
export const reloadDataStore = () => {
  store.student = db.get('student') || []
  store.class = db.get('class') || {}
  // 清除学生Map缓存
  studentMap.clear()
  store.student.forEach(s => studentMap.set(s.id, s))
}

// 获取下一个学生ID
export const getNextStudentId = (): number => {
  const list = getStudentList()
  if (list.length === 0) return 1
  return list[list.length - 1].id + 1
}
