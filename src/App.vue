<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
// const platform = window.electronAPI.platform
import NavBar from './components/NavBar.vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
</script>

<template>
  <div class="containter">
    <div class="left">
      <NavBar />
    </div>
    <div class="main">
      <a-card class="card" style="height: 100%">
        <a-config-provider :locale="zhCN">
          <router-view />
        </a-config-provider>
      </a-card>
    </div>
  </div>
</template>

<style scoped lang="less">
.containter {
  display: flex;
  width: 100%;
  height: 100%;
  .left {
    display: flex;
    align-items: center;
    user-select: none;
  }
  .main {
    width: 100%;
    padding: 20px;
    height: 100%;
    background: #ececec;
    .card {
      height: 100%;
      overflow: scroll;
    }
  }
}
:deep(.ant-card-body) {
  height: 100%;
}
</style>
