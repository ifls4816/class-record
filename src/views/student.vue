<script lang="ts" setup>
import { reactive, createVNode, onMounted, toRaw } from 'vue'
import { Type, Student } from '../types/type'
import { columns } from '../utils/data'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import { successMsg } from '../utils/common'
import {
  getStudentList,
  addStudent as addStudentToStore,
  updateStudent,
  deleteStudent as deleteStudentFromStore,
  getNextStudentId,
  getClassData
} from '../store/dataStore'
import { TodayClass } from '../types/type'
import { calTimeTotal } from '../utils/common'

const state = reactive({
  dataSource: [] as Student[],
  searchVal: '',
  modalVisible: false,
  modalTitle: '',
  form: {
    id: -1,
    name: '',
    type: '1',
    crateTime: '',
    frequency: 0,
    disabled: false
  } as Student
})

// 查询学生列表（带课时统计）
const queryList = () => {
  const studentList = getStudentList()
  const allClassObj = getClassData()
  
  // 扁平化课程数据
  let dayList: TodayClass[] = []
  for (let yearKey in allClassObj) {
    const yearObj = allClassObj[yearKey]
    for (let monthKey in yearObj) {
      const monthObj = yearObj[monthKey]
      for (let dayKey in monthObj) {
        dayList.push(...monthObj[dayKey])
      }
    }
  }
  
  // 按学生ID分组
  const classMap = new Map<number, TodayClass[]>()
  dayList.forEach(val => {
    const id = val.studentId as number
    if (!classMap.has(id)) classMap.set(id, [])
    classMap.get(id)!.push(toRaw(val))
  })
  
  // 计算每个学生的课时
  studentList.forEach(s => {
    s.frequencyList = classMap.get(s.id) || []
    s.frequency = calTimeTotal(s.frequencyList) / 60
  })
  
  // 排序：未禁用的靠前
  studentList.sort((a, b) => {
    if (a.disabled && !b.disabled) return 1
    if (!a.disabled && b.disabled) return -1
    return 0
  })
  
  state.dataSource = studentList
  console.log('当前学生列表', studentList)
}

// 顶部搜索按钮
const onSearch = () => {
  const name = state.searchVal
  if (name === '') {
    return queryList()
  }
  const studentList = getStudentList()
  let targetArr: Student[] = []
  studentList.forEach((items: Student) => {
    if (items.name.includes(name)) {
      targetArr.push(items)
    } else {
      state.dataSource = []
    }
  })
  state.dataSource = targetArr
}

// 展示添加/编辑
const showAddModal = (type: Type, record: Student) => {
  if (type === '1') {
    state.modalTitle = '添加学生'
  } else {
    state.modalTitle = '编辑学生'
    state.form = { ...record }
  }
  state.modalVisible = true
}

// 添加数据
const addStudentList = (val: Student) => {
  const crateTime = dayjs().format('YYYY-MM-DD')
  const id = getNextStudentId()
  const items: Student = {
    ...val,
    id,
    crateTime,
    disabled: false,
    frequency: 0,
    frequencyList: []
  }
  addStudentToStore(items)
}

// 编辑数据
const editStudentList = (val: Student) => {
  val.frequencyList = toRaw(val.frequencyList)
  updateStudent(toRaw(val))
}

// 删除数据
const deleteStudentList = (val: Student) => {
  deleteStudentFromStore(val.id)
}

const onSubmit = () => {
  // 添加
  if (state.modalTitle === '添加学生') {
    addStudentList(state.form as Student)
    // 清空form内容
    onCancel()
  } else {
    // 编辑
    editStudentList(state.form as Student)
  }
  queryList()
  successMsg()
  state.modalVisible = false
}

// 清空form表单
const onCancel = () => {
  state.modalVisible = false
  state.form = {
    name: '',
    type: '1',
    id: -1,
    crateTime: '',
    frequency: 0,
    frequencyList: [],
    disabled: false
  }
}

// 点击删除按钮
const onDelete = (record: Student) => {
  Modal.confirm({
    title: `确认要删除学生: [${record.name}] 吗?`,
    centered: true,
    icon: createVNode(ExclamationCircleOutlined),
    content: '删除后将不可恢复, 也可使用[禁用]功能',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk () {
      deleteStudentList(record)
      queryList()
      successMsg()
    }
  })
}

// 点击禁用按钮
const onDisable = (record: Student) => {
  // 浅拷贝也能使数据丧失响应式
  const val = { ...record }
  if (record.disabled) {
    val.disabled = false
    editStudentList(val)
    queryList()
    successMsg()
  } else {
    Modal.confirm({
      title: `确认要禁用学生: [${record.name}] 吗?`,
      centered: true,
      icon: createVNode(ExclamationCircleOutlined),
      content: `禁用后录入课程时的学生列表将不会再显示该学生`,
      okText: '禁用',
      cancelText: '取消',
      onOk () {
        val.disabled = true
        editStudentList(val)
        queryList()
        successMsg()
      }
    })
  }
}

onMounted(queryList)
</script>

<template>
  <!-- 新增/编辑modal -->
  <a-modal
    v-model:visible="state.modalVisible"
    :title="state.modalTitle"
    centered
    :footer="null"
    style="width: 300px;"
    @cancel="onCancel"
  >
    <a-form
      :model="state.form"
      name="basic"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      @finish="onSubmit"
    >
      <a-form-item
        label="学生姓名"
        name="name"
        :rules="[{ required: true, message: '请输入学生姓名' }]"
      >
        <a-input style="width: 120px" v-model:value="state.form.name" />
      </a-form-item>

      <a-form-item label="学生类型" name="type">
        <a-select
          ref="select"
          v-model:value="state.form.type"
          style="width: 120px"
        >
          <a-select-option value="1">校内</a-select-option>
          <a-select-option value="2">校外</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 6, span: 16 }">
        <a-button style="margin-right: 10px" @click="onCancel">取消</a-button>
        <a-button type="primary" html-type="submit">保存</a-button>
      </a-form-item>
    </a-form>
  </a-modal>
  <!-- 输入框 -->
  <a-space direction="horizontal">
    <a-input-search
      v-model:value="state.searchVal"
      placeholder="请输入学生姓名"
      enter-button="查找学生"
      @search="onSearch"
    />
    <a-button
      class="editable-add-btn"
      @click="showAddModal('1', state.dataSource[0])"
      type="primary"
      style="margin-bottom: 20px;"
      >添加学生</a-button
    >
  </a-space>
  <!-- 表格 -->
  <a-table
    :dataSource="state.dataSource"
    :columns="columns"
    :pagination="{ pageSize: 9, hideOnSinglePage: true }"
    size="small"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'type'">
        <a-tag v-if="record.type === '1'" color="green">校内</a-tag>
        <a-tag v-else color="geekblue">校外</a-tag>
      </template>
      <template v-if="column.key === 'action'">
        <span>
          <a @click="onDisable(record)">{{
            record.disabled ? '启用' : '禁用'
          }}</a>
          <a-divider type="vertical" />
          <a style="color: #389e0d;" @click="showAddModal('2', record)">编辑</a>
          <a-divider type="vertical" v-if="record.frequency === 0" />
          <a
            style="color: red;"
            @click="onDelete(record)"
            v-if="record.frequency === 0"
            >删除</a
          >
        </span>
      </template>
    </template>
  </a-table>
</template>

<style scoped>
.ant-space {
  align-items: flex-start;
}
</style>
