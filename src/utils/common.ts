/*
 * @Description: 通用函数
 * @Author: IFLS
 * @Date: 2023-03-25 22:12:11
 * @LastEditTime: 2023-04-01 12:47:52
 */
import { message as Message } from 'ant-design-vue'
import dayjs, { Dayjs, UnitType } from 'dayjs'
import { db } from '../server/db/initDB'
import { Student, TodayClass } from '../types/type'
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
export const calTimeTotal = (arr: TodayClass[]) => {
  const time = arr.reduce((total: number, currentVal: any) => {
    return total + currentVal.timeDiff
  }, 0)
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

// 查询学生列表
export const queryStudentList = () => {
  const studentList = db.get('student')
  const allClassObj = db.get('class')
  // 将年度数据转换为扁平的课时数据
  let dayList: TodayClass[] = []
  for (let yearKey in allClassObj) {
    const yearObj = allClassObj[yearKey]
    for (let monthKey in yearObj) {
      const monthObj = yearObj[monthKey]
      for (let dayKey in monthObj) {
        const dayObj = monthObj[dayKey]
        dayList.push(dayObj)
        dayList = dayList.flat(Infinity)
      }
    }
  }
  // 遍历学生列表和课程列表 将课程列表挂载到对应学生名下
  studentList.forEach((values: Student) => {
    values.frequencyList = []
    dayList.forEach((val: TodayClass) => {
      if (values.id === val.studentId) {
        values.frequencyList.push(toRaw(val))
      }
    })
    const frequency = calTimeTotal(values.frequencyList) / 60
    values.frequency = frequency
  })
  return studentList
}

// 根据id查询学生信息
export const queryStudentInfo = (studentId: number): Student => {
  const studentList = db.get('student')
  const idx = studentList.findIndex((items: Student) => items.id === studentId)
  return studentList[idx] || {}
}

// 获取当前月每一天数据
export const getDaysArrayByMonth = () => {
  //获取当前月份包含的天数
  let daysInMonth = dayjs().daysInMonth()
  const arrDays = []

  //循环获取月份里的日期
  while (daysInMonth) {
    var current = dayjs().date(daysInMonth).format('D')
    arrDays.unshift(current)
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
