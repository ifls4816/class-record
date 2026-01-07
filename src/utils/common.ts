/*
 * @Description: 通用函数
 * @Author: IFLS
 * @Date: 2023-03-25 22:12:11
 * @LastEditTime: 2023-07-24 16:06:17
 */
import { message as Message } from 'ant-design-vue'
import dayjs, { Dayjs, UnitType } from 'dayjs'
import { db } from '../server/db/initDB'
import { Student, SeriesData, TodayClass } from '../types/type'
import { toRaw } from 'vue'

// 操作成功提示
export const successMsg = () => Message.success('操作成功')

// 转换dayjs格式
export const queryYearMonthDay = (currentDay: string | Dayjs): [number, number, number, Dayjs] => {
  const value = dayjs(currentDay)
  const year = value.year()
  const month = value.month() + 1
  const day = value.date()
  return [year, month, day, value]
}

// 根基课程列表计算课程总时间
export const calTimeTotal = (arr: TodayClass[], studentId: number = -999): number => {
  let time = 0
  arr.forEach((val: any) => {
    // 不传第二参数默认计算全部
    if (studentId === -999) {
      time += val.timeDiff
    } else {
      // 根据传入的学生id进行筛选
      if (val.studentId === studentId) {
        time += val.timeDiff
      }
    }
  })
  return time
}

// 计算两个时间的时差
export const calDiffTime = (
  startTime: Dayjs | string,
  endTime: Dayjs | string,
  type: UnitType = 'minutes',
): number => {
  return dayjs(startTime).diff(endTime, type)
}

// 缓存扁平化后的课程数据
let flatClassListCache: TodayClass[] | null = null
let classObjVersion = 0

// 获取扁平化的课程列表（带缓存）
const getFlatClassList = (): TodayClass[] => {
  const allClassObj = db.get('class')
  // 简单的版本检测，如果数据变化则重新计算
  const currentVersion = JSON.stringify(allClassObj).length
  if (flatClassListCache && classObjVersion === currentVersion) {
    return flatClassListCache
  }
  
  let dayList: TodayClass[] = []
  for (let yearKey in allClassObj) {
    const yearObj = allClassObj[yearKey]
    for (let monthKey in yearObj) {
      const monthObj = yearObj[monthKey]
      for (let dayKey in monthObj) {
        const dayObj = monthObj[dayKey]
        dayList.push(...dayObj)
      }
    }
  }
  
  flatClassListCache = dayList
  classObjVersion = currentVersion
  return dayList
}

// 清除课程缓存（数据变更时调用）
export const clearClassCache = () => {
  flatClassListCache = null
  classObjVersion = 0
}

// 查询学生列表
export const queryStudentList = () => {
  const studentList = db.get('student')
  const dayList = getFlatClassList()
  
  // 预先按学生ID分组课程，避免重复遍历
  const classMap = new Map<number, TodayClass[]>()
  dayList.forEach((val: TodayClass) => {
    const id = val.studentId as number
    if (!classMap.has(id)) {
      classMap.set(id, [])
    }
    classMap.get(id)!.push(toRaw(val))
  })
  
  // 遍历学生列表，从 Map 中获取对应课程
  studentList.forEach((values: Student) => {
    values.frequencyList = classMap.get(values.id) || []
    values.frequency = calTimeTotal(values.frequencyList) / 60
  })

  // 根据disabled字段排序 将未禁用的学生靠前
  studentList.sort((a: Student, b: Student) => {
    if (a.disabled && !b.disabled) {
      return 1 // a排在b后面
    } else if (!a.disabled && b.disabled) {
      return -1 // a排在b前面
    } else {
      return 0 // 保持原来的顺序
    }
  })

  return studentList
}

// 学生信息缓存 Map
let studentMapCache: Map<number, Student> | null = null

// 根据id查询学生信息（优化版）
export const queryStudentInfo = (studentId: number, refreshList = false): Student => {
  if (!studentMapCache || refreshList) {
    const studentList = db.get('student')
    studentMapCache = new Map()
    studentList.forEach((s: Student) => studentMapCache!.set(s.id, s))
  }
  return studentMapCache.get(studentId) || {} as Student
}

// 清除学生缓存（数据变更时调用）
export const clearStudentCache = () => {
  studentMapCache = null
}

// 获取当前月每一天数据
export const getDaysArrayByMonth = (currentDay: Dayjs) => {
  //获取当前月份包含的天数
  let daysInMonth = currentDay.daysInMonth()
  const arrDays = []

  //循环获取月份里的日期
  while (daysInMonth) {
    // const current = dayjs().date(daysInMonth).format('DD')
    arrDays.unshift(daysInMonth)
    daysInMonth--
  }
  return arrDays
}

// 获取当前周每一天数据
export const getDaysArrayByWeek = () => {
  let weekLastDay = Number(dayjs().startOf('week').add(6, 'day').format('D'))
  const targetDay = weekLastDay - 7
  const arrDays = []
  while (weekLastDay > targetDay) {
    var current = dayjs().date(weekLastDay).format('M-D')
    arrDays.unshift({
      m: current.split('-')[0],
      d: current.split('-')[1],
    })
    weekLastDay--
  }
  return arrDays
}

// 数组求和
export const sumArr = (arr: number[]): number => {
  return arr.reduce((total, value) => {
    return total + value
  }, 0)
}

// 根据学生id分组学生课时数据（优化版，避免重复刷新缓存）
export const groupingById = (arr: TodayClass[]): SeriesData[] => {
  // 先刷新一次学生缓存
  queryStudentInfo(-1, true)
  
  const resultMap = new Map<number, SeriesData>()

  for (const item of arr) {
    const studentId = item.studentId as number
    if (resultMap.has(studentId)) {
      resultMap.get(studentId)!.value += item.timeDiff / 60
    } else {
      resultMap.set(studentId, {
        studentId,
        value: item.timeDiff / 60,
        name: queryStudentInfo(studentId, false).name, // 不再每次刷新
      })
    }
  }
  
  return Array.from(resultMap.values())
}
