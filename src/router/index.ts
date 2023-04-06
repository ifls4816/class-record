import {
  createRouter,
  // createWebHistory,
  Router,
  RouteRecordRaw,
  createWebHashHistory,
} from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home.vue'),
    children: [],
    meta: {
      key: '1',
    },
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: () => import('@/views/analysis.vue'),
    children: [],
    meta: {
      key: '2',
    },
  },
  {
    path: '/student',
    name: 'student',
    component: () => import('@/views/student.vue'),
    children: [],
    meta: {
      key: '3',
    },
  },
  {
    path: '/setting',
    name: 'setting',
    component: () => import('@/views/setting.vue'),
    children: [],
    meta: {
      key: '4',
    },
  },
]

const router: Router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// router.beforeEach((to, form, next) => {
//   next()
// })

export default router
