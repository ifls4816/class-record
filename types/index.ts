/**
 * 数据类型定义
 */

/**
 * 课程记录接口
 */
export interface TodayClass {
  studentId: number | null
  time: [string, string] // [开始时间, 结束时间]
  timeDiff: number
  isFuture?: boolean // 是否是未来课时
}

/**
 * 学生接口
 */
export interface Student {
  id: number
  name: string
  createTime: string
  disabled: boolean
}

/**
 * 课程数据结构
 * 嵌套对象: { 年: { 月: { 日: TodayClass[] } } }
 */
export type ClassData = Record<number, Record<number, Record<number, TodayClass[]>>>

/**
 * 存储数据结构
 */
export interface StorageData {
  students: Student[]
  classData: ClassData
  syncTime?: string
  backupTime?: string
  version?: string
}

/**
 * WebDAV 配置
 */
export interface WebDAVConfig {
  url: string
  username: string
  password: string
}
