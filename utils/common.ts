/**
 * 通用工具函数
 */

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 创建学生对象
 */
export function createStudent(id: number, name: string): import('@/types').Student {
  return {
    id,
    name,
    createTime: formatDate(new Date()),
    disabled: false
  }
}

/**
 * 创建课程记录对象
 */
export function createTodayClass(
  studentId: number | null,
  startTime: string,
  endTime: string,
  isFuture: boolean = false
): import('@/types').TodayClass {
  const timeDiff = calculateTimeDiff(startTime, endTime)
  return {
    studentId,
    time: [startTime, endTime],
    timeDiff,
    isFuture
  }
}

/**
 * 计算时间差(分钟)
 */
export function calculateTimeDiff(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期字符串显示（如：2025-03-14）
 * @param dateStr 日期字符串（支持 ISO 格式或时间戳）
 */
export function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return ''
  // 处理 ISO 格式或其他格式，只取日期部分
  return dateStr.split('T')[0].split(' ')[0]
}

/**
 * 解析日期字符串
 */
export function parseDate(dateStr: string): [number, number, number] {
  const [year, month, day] = dateStr.split('-').map(Number)
  return [year, month, day]
}

/**
 * 分钟转小时
 */
export function minutesToHours(minutes: number): number {
  return minutes / 60
}

/**
 * 小时转分钟
 */
export function hoursToMinutes(hours: number): number {
  return hours * 60
}
