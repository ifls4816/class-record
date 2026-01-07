import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './server/db/initDB'
import { initDataStore } from './store/dataStore'
// 函数式组件样式
import './styles/antd.less'

// 初始化数据缓存
initDataStore()

createApp(App).use(router).mount('#app')
