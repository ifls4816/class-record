<script lang="ts" setup>
import { createVNode } from 'vue'
import {
  UpSquareOutlined,
  DownSquareOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import { Modal, message as Message } from 'ant-design-vue'
import { db } from '../server/db/initDB'
import { successMsg } from '../utils/common'

const electronBackup = window.electronAPI.backup

const backup = () => electronBackup.set()

const restore = () => {
  const data = electronBackup.get()
  try {
    const store = JSON.parse(data as string)
    if (store.canceled) return // 点击取消按钮
    if (store.class && store.student) {
      Modal.confirm({
        title: '注意',
        centered: true,
        icon: createVNode(ExclamationCircleOutlined),
        content: '此操作会覆盖本地所有数据, 是否确认?',
        okText: '确认',
        okType: 'danger',
        cancelText: '取消',
        onOk () {
          // deleteClass(index)
          db.set('student', store.student)
          db.set('class', store.class)
          successMsg()
        }
      })
    } else {
      throw new Error()
    }
  } catch (err) {
    console.log(err)
    Message.error('文件异常, 恢复失败')
  }
}
</script>
<template>
  <div>
    <a-result
      status="404"
      title="数据备份与恢复"
      sub-title="这里可以把你的数据进行导入和导出喔."
    >
      <template #extra>
        <a-button type="primary" @click="backup">
          <template #icon>
            <UpSquareOutlined />
          </template>
          备份数据
        </a-button>
        <a-button type="primary" @click="restore">
          <template #icon>
            <DownSquareOutlined />
          </template>
          恢复数据
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
:deep().ant-result {
  padding: 32px;
}
</style>
