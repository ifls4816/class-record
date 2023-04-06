<script lang="ts" setup>
import { onMounted } from 'vue'
import * as echarts from 'echarts'
import { db } from '../server/db/initDB'
import dayjs from 'dayjs'
import {
  queryYearMonthDay,
  getDaysArrayByMonth,
  getDaysArrayByWeek,
  calTimeTotal,
  queryStudentList,
} from '../utils/common'
import { Student } from '../types/type'

const classObj = db.get('class')
const [year, month] = queryYearMonthDay(dayjs())
// 获取当月记录
const monthObj = (classObj ?? classObj[year] ?? classObj[year][month]) || {}

// box1
// 当前周数组
const weekList = getDaysArrayByWeek()
// 当前周记录[1课时,2课时,0.5课时...]
let weekValue: number[] = []
weekList.forEach((values: any) => {
  // const dayData = monthObj[values] ?? 0
  const dayData = (classObj && classObj[year] && classObj[year][values.m] && classObj[year][values.m][values.d]) ?? 0
  // 当天有课时情况: 计算课时
  if (dayData.length > 0) {
    weekValue.push(calTimeTotal(dayData) / 60)
  } else {
    // 无课时情况
    weekValue.push(0)
  }
})

// box2
// 获取月视图x轴的正月数据[1,2,3,4...]
const monthXAxis = getDaysArrayByMonth()
// 将当月记录转换为[1课时,2课时,0.5课时...]
let monthValue: number[] = []
monthXAxis.forEach((values: any) => {
  const dayData = monthObj[values] ?? 0
  // 当天有课时情况: 计算课时
  if (dayData.length > 0) {
    monthValue.push(calTimeTotal(dayData) / 60)
  } else {
    // 无课时情况
    monthValue.push(0)
  }
})

// box3
const studenList = queryStudentList()
let echartsBoxList: any = []
studenList.forEach((val: Student) => {
  echartsBoxList.push({
    value: val.frequency,
    name: val.name,
  })
})

onMounted(() => {
  const box1 = echarts.init(document.getElementById('box1') as HTMLElement)
  const box2 = echarts.init(document.getElementById('box2') as HTMLElement)
  const box3 = echarts.init(document.getElementById('box3') as HTMLElement)

  box1.setOption({
    title: {
      text: '本周课时',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        let res = `<span style="color: #f2ca6b">${params[0].name}</span>`
        for (var i = 0; i < params.length; i++) {
          res +=
            ': <br>' + '共计' + `<span style="color: #de6e6a">${params[i].data}</span>` + '课时'
        }
        return res
      },
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}h',
      },
    },
    series: [
      {
        data: weekValue,
        type: 'bar',
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(68, 142, 247, 0.2)',
        },
      },
    ],
  })

  box2.setOption({
    title: {
      text: '本月课时',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        var res = '本月' + `<span style="color: #f2ca6b">${params[0].name}</span>`
        for (var i = 0; i < params.length; i++) {
          res +=
            '号: <br>' + '共计' + `<span style="color: #de6e6a">${params[i].data}</span>` + '课时'
        }
        return res
      },
    },
    xAxis: {
      type: 'category',
      data: monthXAxis, // 获取当前月份的每一天 返回数组
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} h',
      },
    },
    series: [
      {
        data: monthValue,
        type: 'line',
      },
    ],
  })

  box3.setOption({
    title: {
      text: '学生课时占比',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        const {
          data: { name, value },
          color,
          percent,
        } = params
        const html = `<span style="color: ${color}">${name}: </span><br/>累计${value}课时<br/>占比${percent}%`
        return html
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: echartsBoxList,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  })
})
</script>
<template>
  <div class="box">
    <div id="box1"></div>
    <div id="box2">2</div>
    <div id="box3">3</div>
  </div>
</template>

<style scoped>
.box {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
}
.box > div {
  width: 50%;
  height: 50%;
}
#box3 {
  width: 100%;
}
</style>
