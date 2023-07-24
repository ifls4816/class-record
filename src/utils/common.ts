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

// 根据id查询学生信息
let studentList = db.get('student')
export const queryStudentInfo = (studentId: number, reflashList = false): Student => {
  if (reflashList) {
    studentList = db.get('student')
  }
  const idx = studentList.findIndex((items: Student) => items.id === studentId)
  return studentList[idx] || {}
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

// 根据学生id分组学生课时数据
export const groupingById = (arr: TodayClass[]): SeriesData[] => {
  const idArr: any = []
  const resultData: SeriesData[] = []

  for (let i = 0; i < arr.length; i++) {
    if (idArr.indexOf(arr[i].studentId) === -1) {
      const studentId = arr[i].studentId as number
      resultData.push({
        studentId: studentId,
        value: arr[i].timeDiff / 60,
        name: queryStudentInfo(studentId, true).name,
      })
      idArr.push(arr[i].studentId)
    } else {
      for (let j = 0; j < resultData.length; j++) {
        if (resultData[j].studentId === arr[i].studentId) {
          resultData[j].value += arr[i].timeDiff / 60
          break
        }
      }
    }
  }
  return resultData
}
