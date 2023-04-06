<script lang="ts" setup>
import { reactive, watch } from 'vue'
import {
  BarChartOutlined,
  EditOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()

const route = useRoute()

const state = reactive({
  selectedKeys: ['1'],
  openKeys: []
})

const jumpTo = (val: string) => router.push({ name: val })

watch(route, newVal => {
  const key = [newVal.meta.key]
  state.selectedKeys = key as string[]
})
</script>

<template>
  <a-menu
    v-model:openKeys="state.openKeys"
    v-model:selectedKeys="state.selectedKeys"
    mode="vertical"
    style="width: 140px;"
  >
    <a-menu-item key="1" @click="jumpTo('home')">
      <template #icon>
        <EditOutlined />
      </template>
      录入信息
    </a-menu-item>
    <a-menu-item key="2" @click="jumpTo('analysis')">
      <template #icon>
        <BarChartOutlined />
      </template>
      课时分析
    </a-menu-item>
    <a-menu-item key="3" @click="jumpTo('student')">
      <template #icon>
        <UserOutlined />
      </template>
      学生列表
    </a-menu-item>
    <a-menu-item key="4" @click="jumpTo('setting')">
      <template #icon>
        <SettingOutlined />
      </template>
      系统设置
    </a-menu-item>
  </a-menu>
</template>
