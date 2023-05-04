<script lang="ts" setup>
import { onMounted, reactive, watch } from 'vue'
import * as echarts from 'echarts'
import { db } from '../server/db/initDB'
import dayjs, { Dayjs } from 'dayjs'
import {
  queryYearMonthDay,
  getDaysArrayByMonth,
  getDaysArrayByWeek,
  calTimeTotal,
  groupingById,
  sumArr
} from '../utils/common'
import { Student, SeriesData, TodayClass } from '../types/type'

const state = reactive({
  currentDate: dayjs(), // 当前时间
  pieData: [] as SeriesData[],
  monthData: {
    monthValue: [] as number[],
    monthXAxis: [] as string[]
  },
  totalTime: 0, // 课时总计
  studentId: -999, // 学生id
  studentList: [] as Student[] // 学生列表
})

// watch日期变化
watch(
  () => [state.currentDate, state.studentId],
  () => {
    init()
  }
)

// 查询基本日期函数
const queryBase = (currentDay: string | Dayjs) => {
  const classObj = db.get('class')
  // const [year, month] = queryYearMonthDay(dayjs())
  const [year, month] = queryYearMonthDay(currentDay)
  // 获取当月记录
  // const monthObj = (classObj ?? classObj[year] ?? classObj[year][month]) || {}
  const monthObj = (classObj && classObj[year] && classObj[year][month]) || {}

  return {
    classObj,
    year,
    month,
    monthObj
  }
}

// 查询学生列表
const queryStudentList = () => {
  let studentList = db.get('student')
  // 过滤禁用状态学生列表
  studentList = studentList.reduce((total: Student[], currentVal: Student) => {
    if (!currentVal.disabled) {
      total.push(currentVal)
    }
    return total
  }, [])
  const allStudent: Student = {
    id: -999,
    name: '全部',
    type: '1',
    crateTime: '',
    frequency: -999,
    frequencyList: [],
    disabled: false
  }
  studentList.unshift(allStudent)
  console.log('当前学生列表', studentList)
  state.studentList = studentList
}

// 查询折线图数据
const queryLineData = () => {
  const { monthObj } = queryBase(state.currentDate)
  // box2
  // 获取月视图x轴的正月数据[1,2,3,4...]
  const monthXAxis = getDaysArrayByMonth()
  // 将当月记录转换为[1课时,2课时,0.5课时...]
  let monthValue: number[] = []
  monthXAxis.forEach((values: any) => {
    const dayData = monthObj[values] ?? 0
    // 当天有课时情况: 计算课时
    if (dayData.length > 0) {
      monthValue.push(calTimeTotal(dayData, state.studentId) / 60)
    } else {
      // 无课时情况
      monthValue.push(0)
    }
  })
  state.totalTime = sumArr(monthValue)
  Object.assign(state.monthData, { monthValue, monthXAxis })
}

// 查询饼图数据
const queryPieData = () => {
  const { monthObj } = queryBase(state.currentDate)
  // 扁平化后的月份数据
  let dayList: TodayClass[] = []
  for (let dayKey in monthObj) {
    const dayObj = monthObj[dayKey]
    dayList.push(dayObj)
    // 扁平化月份数据为数组
    dayList = dayList.flat(Infinity)
  }
  state.pieData = groupingById(dayList)
}

const drawBoxLine = () => {
  const dom = document.getElementById('box1') as HTMLElement
  let echart = echarts.getInstanceByDom(dom)
  if (echart === undefined) {
    echart = echarts.init(dom)
  }
  echart.setOption({
    title: {
      text: `${state.currentDate.format('YYYY年M月')} (共${
        state.totalTime
      }课时)`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        var res =
          '本月' + `<span style="color: #f2ca6b">${params[0].name}</span>`
        for (var i = 0; i < params.length; i++) {
          res +=
            '号: <br>' +
            '共计' +
            `<span style="color: #de6e6a">${params[i].data}</span>` +
            '课时'
        }
        return res
      }
    },
    xAxis: {
      type: 'category',
      data: state.monthData.monthXAxis // 获取当前月份的每一天 返回数组
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} h'
      }
    },
    series: [
      {
        type: 'bar',
        label: {
          show: true,
          // 去0
          formatter: (e: any) => {
            if (e.value > 0) {
              return e.value
            } else {
              return ''
            }
          },
          position: 'top'
        },
        data: state.monthData.monthValue
      }
    ]
  })
}

const drawBoxPie = () => {
  const dom = document.getElementById('box2') as HTMLElement
  let echart = echarts.getInstanceByDom(dom)
  if (echart === undefined) {
    echart = echarts.init(dom)
  }
  echart.setOption({
    title: {
      text: '学生课时占比',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const {
          data: { name, value },
          color,
          percent
        } = params
        const html = `<span style="color: ${color}">${name}: </span><br/>累计${value}课时<br/>占比${percent}%`
        return html
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      icon: 'circle',
      formatter: (name: string) => {
        let param: SeriesData = { name: '', value: 0 }
        state.pieData.forEach(val => {
          if (val.name === name) {
            param = val
          }
        })
        return `${param.name}: ${param.value}h`
      }
    },
    series: [
      {
        label: {
          show: true
        },
        type: 'pie',
        radius: '50%',
        data: state.pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })
}

const init = () => {
  queryPieData()
  queryLineData()
  drawBoxLine()
  drawBoxPie()
}

onMounted(() => {
  queryStudentList()
  init()
})
</script>
<template>
  <div>
    <a-form layout="inline">
      <a-form-item label="选择时间" style="width: 200px;">
        <a-date-picker
          class="date-picker"
          v-model:value="state.currentDate"
          picker="month"
          inputReadOnly
        />
      </a-form-item>
      <a-form-item label="选择学生" style="width: 200px;">
        <a-select
          placeholder="选择学生"
          ref="select"
          v-model:value="state.studentId"
        >
          <a-select-option
            v-for="items of state.studentList"
            :key="items.id"
            :value="items.id"
            >{{ items.name }}</a-select-option
          >
        </a-select>
      </a-form-item>
    </a-form>
  </div>
  <div class="box">
    <div id="box1"></div>
    <div id="box2"></div>
  </div>
</template>

<style scoped>
.date-picker {
  float: right;
  margin-bottom: 18px;
}
.box {
  width: 100%;
  height: 93%;
}
.box > div {
  height: 50%;
  width: 100%;
}
</style>
