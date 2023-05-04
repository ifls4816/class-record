<script lang="ts" setup>
import { reactive, onMounted, toRaw, createVNode } from 'vue'
import { Student, TodayClass } from '../types/type'
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import { db } from '../server/db/initDB'
import { Modal } from 'ant-design-vue'
import {
  successMsg,
  calTimeTotal,
  queryYearMonthDay,
  calDiffTime,
  queryStudentInfo
} from '../utils/common'

const state = reactive({
  value: '', // 日历value
  dateMode: '月',
  totalTimeBySchool: 0, // 课时
  totalTimeByOut: 0, // 课时
  drawerVisible: false,
  drawerTitle: '', // 抽屉标题
  drawerCurrentList: [] as any, // 当前日期下列表
  studentList: [] as Student[], // 学生列表(不包含禁用状态)
  classList: {} as any, // 课程列表
  classForm: {
    studentId: null,
    time: [],
    timeDiff: 0
  } as TodayClass, // 当日课程对象
  classFormlVisible: false, // 课程弹窗
  currentTime: dayjs() // 当前时间
})

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
  console.log('当前学生列表', studentList)
  state.studentList = studentList
}

// 查询课程列表
const queryClassList = () => {
  const classObj = db.get('class')
  state.classList = classObj
  console.log('课程列表', state.classList)
}

// 获取日历月份数据
const getListData = (value: Dayjs) => {
  const year = value.year()
  const month = value.month() + 1
  const day = value.date()
  if (state.classList[year]) {
    if (state.classList[year][month]) {
      if (state.classList[year][month][day]) {
        return state.classList[year][month][day]
      } else {
        return []
      }
    } else {
      return []
    }
  } else {
    return []
  }
}

// 获取日历年份数据
const getMonthData = (current: Dayjs): TodayClass[] => {
  const [year, month] = queryYearMonthDay(current)
  if (state.classList[year]) {
    if (state.classList[year][month]) {
      // 去除数据响应式
      const obj = toRaw(state.classList[year][month])
      // 获取数据对象的value值
      const arr = Object.values(obj)
      // 将数二级组将为一级数组
      return arr.flat(Infinity) as TodayClass[]
    } else {
      return []
    }
  } else {
    return []
  }
}

// 切换日历面板
const onPanelChange = (value: Dayjs, mode: 'month' | 'year') => {
  console.log('切换日历面板', { value, mode })
  state.currentTime = value
  state.dateMode = mode === 'month' ? '月' : '年'
  calTodayTime()
}

// 展示抽屉
const showDrawer = () => (state.drawerVisible = true)

// 查询当前日期下抽屉列表数据
const queryDrawerCurrentList = (current: Dayjs) => {
  const currentVal = getListData(current)
  state.drawerCurrentList = currentVal
}

// 提交课程表单
const onSubmitClassForm = () => {
  const [year, month, day, value] = queryYearMonthDay(state.drawerTitle)
  const classObj = db.get('class')
  classObj[year] = classObj[year] || {}
  classObj[year][month] = classObj[year][month] || {}
  classObj[year][month][day] = classObj[year][month][day] || []
  // 去除classForm reactive响应式
  const classForm = toRaw(state.classForm)
  const startTime = `${state.drawerTitle} ${classForm.time[1]}`
  const endTime = `${state.drawerTitle} ${classForm.time[0]}`
  // 计算课时分钟数
  const timeDiff = calDiffTime(startTime, endTime)
  // 保存分钟数
  classForm['timeDiff'] = timeDiff
  classObj[year][month][day].push(classForm)
  const dayArr = classObj[year][month][day]
  // 当日列表按照时间进行排序
  const arr = dayArr.sort((a: any, b: any) => {
    return a.time[0].slice(0, 2) - b.time[0].slice(0, 2)
  })
  classObj[year][month][day] = arr
  // 保存数据
  db.set('class', classObj)
  // 查询日历整体课程列表
  queryClassList()
  // 更新当前抽屉下列表数据
  queryDrawerCurrentList(value)
  // 重新计算课时总时间
  calTodayTime()
  // 清空表单
  onCancelClassForm()
}

// 点击删除按钮
const onDelete = (index: number) => {
  Modal.confirm({
    title: '删除',
    centered: true,
    icon: createVNode(ExclamationCircleOutlined),
    content: '确定要删除当前记录吗?',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk () {
      deleteClass(index)
    }
  })
}

// 根据索引删除课程
const deleteClass = (index: number) => {
  const [year, month, day, value] = queryYearMonthDay(state.drawerTitle)
  const classObj = db.get('class')
  const dayList = classObj[year][month][day]
  dayList.splice(index, 1)
  classObj[year][month][day] = dayList
  db.set('class', classObj)
  queryClassList()
  queryDrawerCurrentList(value)
  calTodayTime()
  successMsg()
}

// 取消课程弹窗
const onCancelClassForm = () => {
  state.classForm = {
    studentId: null,
    time: [],
    timeDiff: 0
  }
  state.classFormlVisible = false
}

// 点击日历版面某天数据
const onClickTask = (current: Dayjs) => {
  state.drawerTitle = current.format('YYYY-MM-DD')
  queryDrawerCurrentList(current)
  showDrawer()
}

// 计算课时总数
const calTodayTime = () => {
  const { currentTime, classList, dateMode } = state
  let monthList = []
  let schoolList: TodayClass[] = [] // 校内数据
  let outList: TodayClass[] = [] // 校外数据
  if (dateMode === '月') {
    //  计算月度总时间
    monthList = getMonthData(currentTime)
  } else {
    const [year] = queryYearMonthDay(currentTime)
    const yearObj = toRaw(classList[year])
    for (let key in yearObj) {
      const monthObj = yearObj[key]
      for (let monthObjKey in monthObj) {
        monthList.push(monthObj[monthObjKey])
      }
    }
    // 计算年度总时间
    monthList = monthList.flat(Infinity)
  }
  monthList.forEach((val: TodayClass) => {
    const studentType = queryStudentInfo(val.studentId as number)
    if (studentType.type === '1') {
      schoolList.push(val)
    } else {
      outList.push(val)
    }
  })
  state.totalTimeBySchool = calTimeTotal(schoolList) / 60
  state.totalTimeByOut = calTimeTotal(outList) / 60
}

onMounted(() => {
  queryStudentList()
  queryClassList()
  calTodayTime()
})
</script>

<template>
  <div class="box">
    <!-- 抽屉 -->
    <a-drawer
      v-model:visible="state.drawerVisible"
      class="drawer-class"
      placement="right"
      :closable="false"
    >
      <div class="drawer-box">
        <div class="drawer-content">
          <div v-if="state.drawerCurrentList.length !== 0">
            <a-card :title="state.drawerTitle">
              <a-timeline>
                <a-timeline-item
                  v-for="(item, index) of state.drawerCurrentList"
                  :key="index"
                >
                  <div class="time-line-box">
                    <span>
                      {{ item.time[0] + ' -- ' + item.time[1] }}
                    </span>
                    <span>
                      <a-tag
                        closable
                        @close.prevent="onDelete(index)"
                        :color="
                          queryStudentInfo(item.studentId).type === '1'
                            ? 'green'
                            : 'geekblue'
                        "
                      >
                        {{ queryStudentInfo(item.studentId).name }}
                      </a-tag>
                    </span>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </div>
          <div class="drawer-empty" v-else>
            <a-empty :description="'今天还没有添加记录喔~'" />
          </div>
        </div>
        <a-button type="primary" shape="circle" size="large" class="drawer-btn">
          <template #icon>
            <div @click="state.classFormlVisible = true">
              <PlusOutlined />
            </div>
          </template>
        </a-button>
      </div>
    </a-drawer>

    <!-- 添加记录modal -->
    <a-modal
      v-model:visible="state.classFormlVisible"
      title="添加记录"
      centered
      :footer="null"
      style="width: 370px;"
      @cancel="onCancelClassForm"
    >
      <a-form
        :model="state.classForm"
        name="basic"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 16 }"
        autocomplete="off"
        @finish="onSubmitClassForm"
      >
        <a-form-item
          name="time"
          label="选择时段"
          :rules="[{ required: true, message: '请选择时段' }]"
        >
          <a-time-range-picker
            v-model:value="state.classForm.time"
            format="HH:mm"
            valueFormat="HH:mm"
            :disabled-time="
              () => {
                return {
                  disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7]
                }
              }
            "
            :hideDisabledOptions="true"
            :minuteStep="30"
          />
        </a-form-item>

        <a-form-item
          name="studentId"
          label="选择学生"
          :rules="[{ required: true, message: '请选择学生' }]"
        >
          <a-select
            placeholder="选择学生"
            ref="select"
            v-model:value="state.classForm.studentId"
            style="width: 194px"
          >
            <a-select-option
              v-for="items of state.studentList"
              :value="items.id"
              :key="items.id"
              >{{ items.name }}</a-select-option
            >
          </a-select>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 7, span: 16 }">
          <a-button style="margin-right: 10px" @click="onCancelClassForm"
            >取消</a-button
          >
          <a-button type="primary" html-type="submit">保存</a-button>
        </a-form-item>
      </a-form>
    </a-modal>

    <div>
      <div class="cal">
        <a-statistic
          :title="`本${state.dateMode}校内课时`"
          :value="state.totalTimeBySchool"
          style="margin-right: 20px"
        >
        </a-statistic>
        <a-statistic
          :title="`本${state.dateMode}校外课时`"
          :value="state.totalTimeByOut"
          style="margin-right: 50px"
        >
        </a-statistic>
      </div>
      <a-calendar
        v-model:value="state.value"
        :fullscreen="true"
        @panelChange="onPanelChange"
      >
        <template #dateCellRender="{ current }">
          <!-- 每日数据 -->
          <div class="task-box" @click="onClickTask(current)">
            <a-badge
              :overflowCount="999999999"
              :count="calTimeTotal(getListData(current)) / 60"
              :number-style="{ backgroundColor: '#108ee9' }"
            />
          </div>
        </template>
        <template #monthCellRender="{ current }">
          <!-- 年度数据 -->
          <div v-if="getMonthData(current)" class="notes-month">
            <a-badge
              :overflowCount="999999999"
              :count="calTimeTotal(getMonthData(current)) / 60"
              :number-style="{ backgroundColor: '#108ee9' }"
            />
          </div>
        </template>
      </a-calendar>
    </div>
  </div>
</template>

<style scoped>
.box {
  position: relative;
}
.cal {
  display: flex;
  justify-content: flex-start;
  position: absolute;
  top: 0;
  left: 20px;
}
.notes-month {
  text-align: center;
  font-size: 28px;
}
.notes-month section {
  font-size: 28px;
}
:deep().ant-picker-calendar-full
  .ant-picker-panel
  .ant-picker-calendar-date-content {
  height: 42px;
  text-align: center;
}
:deep().ant-statistic-title {
  margin-bottom: 0;
}
.drawer-box {
  width: 100%;
  height: 100%;
}
.drawer-content {
  height: 100%;
}
:deep().drawer-content .ant-card-body {
  padding-bottom: 0;
}
.time-line-box {
  display: flex;
}
.time-line-box > span {
  width: 200px;
}
.ant-timeline-item-last {
  padding-bottom: 0;
}
.drawer-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.drawer-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
}
:deep().ant-picker-content td:not(.ant-picker-cell-in-view) {
  pointer-events: none;
  visibility: hidden;
}
:deep().ant-picker-cell {
  position: relative;
}
.task-box {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  padding-top: 30px;
}
:deep().ant-picker-input > input {
  width: 60px;
}
</style>
