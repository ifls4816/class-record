/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// uni-app 全局类型
declare const uni: typeof import('@dcloudio/uni-app').uni
declare const wx: WechatMiniprogram.Wx
